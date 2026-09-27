import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { currentUserCan } from '@/access/server'

function getDateRange(range: string, from?: string | null, to?: string | null): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  switch (range) {
    case 'today': {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    case 'week': {
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3)
      const start = new Date(now.getFullYear(), q * 3, 1)
      return { start, end }
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start, end }
    }
    case 'custom': {
      return {
        start: from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1),
        end: to ? new Date(to) : end,
      }
    }
    default: {
      // month-to-date
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start, end }
    }
  }
}

function getComparisonRange(start: Date, end: Date): { start: Date; end: Date } {
  const diff = end.getTime() - start.getTime()
  return {
    start: new Date(start.getTime() - diff - 1),
    end: new Date(start.getTime() - 1),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateRegs(paidRegs: any[], allRegs: any[], capacityMap: Map<string, number>, start: Date, end: Date) {
  const grossSalesCents = paidRegs.reduce((s: number, r: any) => s + (r.totalAmount ?? 0), 0)
  const netSalesCents = paidRegs.reduce((s: number, r: any) => s + (r.subtotal ?? 0), 0)
  const totalGstCents = paidRegs.reduce((s: number, r: any) => s + (r.gstAmount ?? 0), 0)
  const totalOrders = paidRegs.length
  const studentsEnrolled = paidRegs.reduce((s: number, r: any) => s + (r.studentCount ?? 0), 0)

  // Sales by city
  const cityMap = new Map<string, { orders: number; students: number; grossCents: number; netCents: number }>()
  for (const reg of paidRegs) {
    const school = reg.school
    const cityName = (typeof school === 'object' && typeof school?.city === 'object' ? school.city?.title : null) ?? 'Unknown'
    const entry = cityMap.get(cityName) ?? { orders: 0, students: 0, grossCents: 0, netCents: 0 }
    entry.orders++
    entry.students += reg.studentCount ?? 0
    entry.grossCents += reg.totalAmount ?? 0
    entry.netCents += reg.subtotal ?? 0
    cityMap.set(cityName, entry)
  }
  const salesByCity = [...cityMap.entries()]
    .map(([city, d]) => ({ city, orders: d.orders, students: d.students, grossSales: d.grossCents / 100, netSales: d.netCents / 100 }))
    .sort((a, b) => b.grossSales - a.grossSales)

  // Variation performance
  const varMap = new Map<string, {
    productTitle: string; school: string; season: string; city: string
    orders: number; students: number; netCents: number; capacity: number
  }>()
  for (const reg of allRegs) {
    const product = reg.product
    const school = reg.school
    const season = reg.season
    const productId = typeof product === 'object' ? product?.id : product
    const schoolId = typeof school === 'object' ? school?.id : school
    const seasonId = typeof season === 'object' ? season?.id : season
    const key = `${productId}-${schoolId}-${seasonId}`
    const entry = varMap.get(key) ?? {
      productTitle: typeof product === 'object' ? (product?.title ?? '') : String(product ?? ''),
      school: typeof school === 'object' ? (school?.title ?? '') : String(school ?? ''),
      season: typeof season === 'object' ? (season?.title ?? '') : String(season ?? ''),
      city: (typeof school === 'object' && typeof school?.city === 'object' ? school.city?.title : null) ?? '',
      orders: 0, students: 0, netCents: 0,
      capacity: capacityMap.get(`${productId}-${schoolId}-${seasonId}`) ?? 20,
    }
    if (reg.paymentStatus === 'paid') {
      entry.orders++
      entry.students += reg.studentCount ?? 0
      entry.netCents += reg.subtotal ?? 0
    }
    varMap.set(key, entry)
  }
  const variationPerformance = [...varMap.entries()]
    .map(([key, d]) => ({
      key, productTitle: d.productTitle, school: d.school, season: d.season, city: d.city,
      orders: d.orders, students: d.students, netSales: d.netCents / 100, capacity: d.capacity,
      fillRate: Math.min(100, Math.round(d.students / Math.max(d.capacity, 1) * 100)),
    }))
    .sort((a, b) => b.netSales - a.netSales)

  // Daily trends
  const dayMap = new Map<string, { revCents: number; orders: number }>()
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const endDay = new Date(end)
  endDay.setHours(0, 0, 0, 0)
  while (cursor <= endDay) {
    dayMap.set(cursor.toISOString().slice(0, 10), { revCents: 0, orders: 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  for (const reg of paidRegs) {
    const day = typeof reg.createdAt === 'string' ? reg.createdAt.slice(0, 10) : ''
    if (day && dayMap.has(day)) {
      const e = dayMap.get(day)!
      e.revCents += reg.totalAmount ?? 0
      e.orders++
    }
  }
  const dailyTrends = [...dayMap.entries()].map(([date, d]) => ({ date, revenue: d.revCents / 100, orders: d.orders }))

  return {
    current: {
      grossSales: grossSalesCents / 100,
      netSales: netSalesCents / 100,
      totalGst: totalGstCents / 100,
      totalOrders,
      studentsEnrolled,
    },
    salesByCity,
    variationPerformance,
    dailyTrends,
    taxSummary: {
      code: 'CA-BC-GST 5%',
      rate: '5%',
      taxableAmount: netSalesCents / 100,
      totalGst: totalGstCents / 100,
    },
  }
}

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  if (!(await currentUserCan(payload, 'analytics', 'read'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') ?? 'month'
  const { start, end } = getDateRange(range, searchParams.get('from'), searchParams.get('to'))
  const comp = getComparisonRange(start, end)

  const dateFilter = (s: Date, e: Date) => ({
    and: [
      { createdAt: { greater_than_equal: s.toISOString() } },
      { createdAt: { less_than_equal: e.toISOString() } },
    ],
  })

  const [currentRes, compRes, productsRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload.find({ collection: 'registrations', where: dateFilter(start, end) as any, limit: 5000, depth: 2, sort: 'createdAt' }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload.find({ collection: 'registrations', where: dateFilter(comp.start, comp.end) as any, limit: 5000, depth: 2, sort: 'createdAt' }),
    payload.find({ collection: 'products', limit: 200, depth: 1 }),
  ])

  const capacityMap = new Map<string, number>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const product of productsRes.docs as any[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const v of (product.variations ?? []) as any[]) {
      capacityMap.set(`${product.id}-${v.school}-${v.season}`, v.capacity ?? 20)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPaid = (currentRes.docs as any[]).filter((r: any) => r.paymentStatus === 'paid')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compPaid = (compRes.docs as any[]).filter((r: any) => r.paymentStatus === 'paid')

  const agg = aggregateRegs(currentPaid, currentRes.docs as any[], capacityMap, start, end)

  const comparison = {
    grossSales: compPaid.reduce((s: number, r: any) => s + (r.totalAmount ?? 0), 0) / 100,
    netSales: compPaid.reduce((s: number, r: any) => s + (r.subtotal ?? 0), 0) / 100,
    totalOrders: compPaid.length,
    studentsEnrolled: compPaid.reduce((s: number, r: any) => s + (r.studentCount ?? 0), 0),
  }

  return NextResponse.json({
    range: { start: start.toISOString(), end: end.toISOString() },
    ...agg,
    comparison,
  })
}

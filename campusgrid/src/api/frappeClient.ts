/**
 * Vidyuth OS — Official Frappe Framework & ERPNext REST Client
 * Compatible with Frappe v15 (LTS) & ERPNext Education DocTypes
 */

export interface FrappeUser {
  id: string
  username: string
  role: string
  full_name: string
  assigned_section?: string
}

export interface FrappeStudent {
  name: string
  student_name: string
  custom_pen_number?: string
  custom_apaar_id?: string
  custom_class?: string
  custom_section?: string
  custom_roll_number?: number | string
  student_mobile_number?: string
  guardian_name?: string
  custom_fee_status?: string
  outstanding_amount?: number
  attendance_rate?: number
}

export interface FrappeAttendanceRecord {
  student_id: string
  status: 'Present' | 'Absent' | 'Late'
}

export interface FrappeFeeReceipt {
  name?: string
  receipt_number: string
  student_id: string
  student_name: string
  amount_paid: number
  payment_mode: string
  created_at: string
}

export class FrappeClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl.replace(/\/+$/, '')
    } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FRAPPE_URL) {
      this.baseUrl = String(import.meta.env.VITE_FRAPPE_URL).replace(/\/+$/, '')
    } else if (typeof window !== 'undefined') {
      const isLocalDev = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
                         window.location.port !== '5050' &&
                         window.location.port !== ''
      this.baseUrl = isLocalDev ? 'http://127.0.0.1:5050' : ''
    } else {
      this.baseUrl = ''
    }

    try {
      this.token = localStorage.getItem('frappe_token') || localStorage.getItem('sos_token')
    } catch {
      this.token = null
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    if (this.token) {
      if (this.token.startsWith('token ') || this.token.startsWith('Bearer ')) {
        headers['Authorization'] = this.token
      } else {
        headers['Authorization'] = `Bearer ${this.token}`
      }
    }
    return headers
  }

  public setToken(token: string | null) {
    this.token = token
    try {
      if (token) {
        localStorage.setItem('frappe_token', token)
        localStorage.setItem('sos_token', token)
      } else {
        localStorage.removeItem('frappe_token')
        localStorage.removeItem('sos_token')
      }
    } catch {
      // ignore
    }
  }

  /**
   * Frappe Method RPC Call (POST /api/method/{methodName})
   */
  public async callMethod<T = any>(methodName: string, args: Record<string, any> = {}): Promise<T> {
    const url = `${this.baseUrl}/api/method/${methodName}`
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(args),
      credentials: 'include',
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Frappe RPC [${methodName}] failed (${res.status}): ${errText}`)
    }

    const data = await res.json()
    return data.message !== undefined ? data.message : data
  }

  /**
   * Frappe Resource GET (GET /api/resource/{docType})
   */
  public async getDocList<T = any>(
    docType: string,
    filters?: Record<string, any>,
    fields: string[] = ['name'],
    limit: number = 50
  ): Promise<T[]> {
    const params = new URLSearchParams()
    if (fields && fields.length > 0) {
      params.set('fields', JSON.stringify(fields))
    }
    if (filters) {
      params.set('filters', JSON.stringify(filters))
    }
    params.set('limit_page_length', String(limit))

    const url = `${this.baseUrl}/api/resource/${encodeURIComponent(docType)}?${params.toString()}`
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    if (!res.ok) {
      const fallbackUrl = `${this.baseUrl}/api/v1/${docType.toLowerCase()}s`
      const fbRes = await fetch(fallbackUrl, { method: 'GET', headers: this.getHeaders() })
      if (fbRes.ok) return await fbRes.json()
      throw new Error(`Frappe Resource GET [${docType}] error: ${res.statusText}`)
    }

    const json = await res.json()
    return json.data || []
  }

  /**
   * Frappe Resource Create (POST /api/resource/{docType})
   */
  public async createDoc<T = any>(docType: string, docData: Record<string, any>): Promise<T> {
    const url = `${this.baseUrl}/api/resource/${encodeURIComponent(docType)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(docData),
      credentials: 'include',
    })

    if (!res.ok) {
      const fallbackUrl = `${this.baseUrl}/api/v1/${docType.toLowerCase()}s/add`
      const fbRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(docData)
      })
      if (fbRes.ok) return await fbRes.json()
      throw new Error(`Frappe Resource POST [${docType}] failed: ${await res.text()}`)
    }

    const json = await res.json()
    return json.data || json
  }

  // --------------------------------------------------------------------------
  // Domain Specific School Mappings
  // --------------------------------------------------------------------------

  public async login(usr: string, pwd: string): Promise<FrappeUser> {
    try {
      const result = await this.callMethod<{ sid?: string; key_details?: any }>('login', { usr, pwd })
      return {
        id: usr,
        username: usr,
        role: usr === 'admin' ? 'Principal' : usr === 'teacher' ? 'Teacher' : usr === 'accountant' ? 'Accountant' : 'Parent',
        full_name: result?.key_details?.full_name || usr
      }
    } catch {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usr, password: pwd })
      })
      if (!res.ok) throw new Error('Authentication failed.')
      const data = await res.json()
      if (data.token) this.setToken(data.token)
      return data.user
    }
  }

  public async getStudents(query: string = ''): Promise<any[]> {
    try {
      return await this.getDocList('Student', query ? { student_name: ['like', `%${query}%`] } : undefined, [
        'name', 'student_name', 'custom_class', 'custom_section', 'custom_roll_number',
        'custom_pen_number', 'custom_apaar_id', 'custom_fee_status', 'outstanding_amount'
      ], 100)
    } catch {
      const res = await fetch(`${this.baseUrl}/api/v1/students?query=${encodeURIComponent(query)}`, {
        headers: this.getHeaders()
      })
      return await res.json()
    }
  }

  public async submitFastAttendance(
    academicClass: string,
    section: string,
    records: FrappeAttendanceRecord[],
    markedBy: string
  ): Promise<any> {
    try {
      return await this.callMethod('school_india.api.attendance.process_fast_roll_call', {
        academic_class: academicClass,
        section,
        attendance_records: records,
        marked_by: markedBy,
      })
    } catch {
      const res = await fetch(`${this.baseUrl}/api/v1/attendance/submit`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          class_name: academicClass,
          section,
          marked_by: markedBy,
          records
        })
      })
      return await res.json()
    }
  }

  public async recordFeeCollection(
    studentId: string,
    amount: number,
    mode: string,
    remarks: string = ''
  ): Promise<any> {
    try {
      return await this.createDoc('Fees', {
        student: studentId,
        grand_total: amount,
        mode_of_payment: mode,
        remarks: remarks || 'Counter fee collection'
      })
    } catch {
      const res = await fetch(`${this.baseUrl}/api/v1/fees/collect`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          admission_number: studentId,
          amount_paid: amount,
          payment_mode: mode,
          remarks
        })
      })
      return await res.json()
    }
  }

  public async dispatchNotice(target: string, channel: string, message: string): Promise<any> {
    try {
      return await this.callMethod('school_india.api.communication.send_broadcast', {
        target,
        channel,
        message
      })
    } catch {
      const res = await fetch(`${this.baseUrl}/api/v1/notices/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ target, channel, message })
      })
      return await res.json()
    }
  }
}

export const frappe = new FrappeClient()

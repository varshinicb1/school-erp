import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Command,
  CreditCard,
  Database,
  Download,
  FileBarChart,
  FileSpreadsheet,
  GraduationCap,
  Key,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Printer,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Users,

  X,
  Zap,
} from 'lucide-react'
import './App.css'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Students', icon: Users },
  { label: 'Classes', icon: BookOpen },
  { label: 'Attendance', icon: ClipboardCheck },
  { label: 'Fees', icon: CircleDollarSign },
  { label: 'Staff', icon: GraduationCap },
  { label: 'Messages', icon: MessageSquareText },
  { label: 'Reports', icon: FileBarChart },
]

const metrics = [
  { label: 'Active students', value: '1,284', detail: '42 admissions pending verification' },
  { label: 'Roll call complete', value: '92.4%', detail: '18 sections submitted late' },
  { label: 'Receivables due', value: '₹4,86,200', detail: '86 invoices past due' },
  { label: 'Open staff cover', value: '6', detail: 'Substitutions required before 09:00' },
]

const attendanceRows = [
  { grade: 'Grade 6', sections: 4, submitted: 4, absent: 18, late: 6, rate: 95 },
  { grade: 'Grade 7', sections: 5, submitted: 4, absent: 31, late: 11, rate: 88 },
  { grade: 'Grade 8', sections: 5, submitted: 3, absent: 44, late: 16, rate: 82 },
  { grade: 'Grade 9', sections: 4, submitted: 4, absent: 22, late: 7, rate: 94 },
  { grade: 'Grade 10', sections: 4, submitted: 4, absent: 25, late: 9, rate: 91 },
]

const students = [
  { id: 'VIS-2026-0048', name: 'Aarav Mehta', grade: '8A', attendance: '96%', balance: '₹0', status: 'Clear' },
  { id: 'VIS-2026-0062', name: 'Maya Reddy', grade: '7C', attendance: '89%', balance: '₹14,200', status: 'Due' },
  { id: 'VIS-2026-0189', name: 'Ibrahim Khan', grade: '10B', attendance: '93%', balance: '₹0', status: 'Clear' },
  { id: 'VIS-2026-0217', name: 'Saanvi Sharma', grade: '6A', attendance: '78%', balance: '₹8,500', status: 'Review' },
  { id: 'VIS-2026-0241', name: 'Nora Patel', grade: '9D', attendance: '98%', balance: '₹0', status: 'Clear' },
  { id: 'VIS-2026-0304', name: 'Aditya Rao', grade: '8C', attendance: '91%', balance: '₹4,750', status: 'Due' },
  { id: 'VIS-2026-0330', name: 'Omar Ali', grade: '6B', attendance: '87%', balance: '₹0', status: 'Clear' },
  { id: 'VIS-2026-0402', name: 'Priya Nair', grade: '10A', attendance: '84%', balance: '₹12,600', status: 'Review' },
]

const timetable = [
  { time: '08:30', className: 'Grade 10B', room: 'Physics Lab', teacher: 'Ms. Rao', note: 'Practical' },
  { time: '10:15', className: 'Grade 7C', room: 'Room 204', teacher: 'Mr. Reddy', note: 'Cover requested' },
  { time: '12:00', className: 'Grade 8A', room: 'Auditorium', teacher: 'Assembly', note: 'All sections' },
  { time: '14:20', className: 'Grade 6A', room: 'Art Studio', teacher: 'Ms. Sharma', note: 'Room changed' },
]

const feeAging = [
  { label: '0-7 days', amount: '₹1,84,200', count: 42 },
  { label: '8-30 days', amount: '₹2,18,800', count: 31 },
  { label: '31+ days', amount: '₹83,200', count: 13 },
]

const announcements = [
  'Bus route 4 delayed by 12 minutes',
  'Parent-teacher meeting slots published',
  'Science fair registration closes today',
]

const API_BASE = (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '3000')) ? 'http://127.0.0.1:5050' : ''

// ---- Authentication helpers (session token from the School OS server) ----
type PersonaRole = 'Principal' | 'Teacher' | 'Parent' | 'Accountant'

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('sos_token')
  } catch {
    return null
  }
}

const authHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getStoredToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

function App() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('Today')
  const [activity, setActivity] = useState('Connected to School OS SQLite Engine')

  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [showTCModal, setShowTCModal] = useState(false)
  const [tcTargetStudent, setTcTargetStudent] = useState<any>(null)
  const [paletteSearch, setPaletteSearch] = useState('')
  const [persona, setPersona] = useState<'Principal' | 'Teacher' | 'Parent' | 'Accountant'>('Principal')
  const [liveStudents, setLiveStudents] = useState(students)
  const [liveMetrics, setLiveMetrics] = useState(metrics)

  // Self-Service Settings & Onboarding Center State
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'profile' | 'gateways' | 'examination' | 'importer' | 'backups'>('profile')
  const [schoolProfile, setSchoolProfile] = useState({
    name: 'Vidyuth International School',
    udise_code: '36190500124',
    board: 'CBSE',
    affiliation_no: '3630142',
    state: 'Telangana',
    city: 'Hyderabad',
    address: 'Plot 42, Knowledge Corridor, Financial District, Hyderabad, Telangana - 500032',
    principal_name: 'Dr. Radhika Sharma',
    academic_year: '2026-27'
  })
  const [systemSettings, setSystemSettings] = useState<Record<string, any>>({
    razorpay_key_id: { value: 'rzp_test_school_sample_key' },
    razorpay_key_secret: { value: '' },
    school_upi_id: { value: 'vidyuth.fees@icici' },
    sms_provider: { value: 'Fast2SMS' },
    sms_api_key: { value: '' },
    sms_sender_id: { value: 'VIDYUT' },
    whatsapp_cloud_token: { value: '' },
    whatsapp_phone_number_id: { value: '' },
    passing_threshold_pct: { value: '33' },
    grading_scale: { value: 'CBSE_9_POINT' },
    grace_marks_max: { value: '5' }
  })
  const [importerText, setImporterText] = useState(`admission_number,student_name,class,section,pen_number,apaar_id,guardian_name,guardian_contact
VIS-2026-0901,Rohit Reddy,Grade 10,A,36190500199,1234-5678-9012,Mr. K. Reddy,+91 98490 11223
VIS-2026-0902,Sneha Rao,Grade 10,A,36190500200,9876-5432-1098,Mrs. S. Rao,+91 98490 44556`)
  const [importResults, setImportResults] = useState<any>(null)
  const [backupSnapshots, setBackupSnapshots] = useState<any[]>([])

  // Report Card & Fee Collection State
  const [showReportCardModal, setShowReportCardModal] = useState(false)
  const [reportCardData, setReportCardData] = useState<any>(null)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [feeTargetStudent, setFeeTargetStudent] = useState<any>(null)
  const [feeAmount, setFeeAmount] = useState('14200')
  const [feePaymentMode, setFeePaymentMode] = useState('UPI / Online')
  const [feeReceiptData, setFeeReceiptData] = useState<any>(null)

  // Teacher Marks Entry & Cashier Day-Book & Lock State
  const [showMarksModal, setShowMarksModal] = useState(false)
  const [marksRoster, setMarksRoster] = useState<any[]>([])
  const [recentReceipts, setRecentReceipts] = useState<any[]>([])
  const [showLockModal, setShowLockModal] = useState(false)
  const [lockUsername, setLockUsername] = useState('admin')
  const [lockPassword, setLockPassword] = useState('')

  // Global Ctrl + K Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowPalette((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setShowPalette(false)
        setShowAttendanceModal(false)
        setShowTCModal(false)
        setShowSettingsModal(false)
        setShowReportCardModal(false)
        setShowFeeModal(false)
        setShowMarksModal(false)
        setShowLockModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({
    'VIS-2026-0048': 'Present',
    'VIS-2026-0062': 'Present',
    'VIS-2026-0189': 'Present',
    'VIS-2026-0217': 'Absent',
    'VIS-2026-0241': 'Present',
    'VIS-2026-0304': 'Present',
    'VIS-2026-0330': 'Late',
    'VIS-2026-0402': 'Present',
  })

  // Live REST API Connection to Backend (session-validated)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Validate any stored session token with the server before pulling data.
    if (getStoredToken()) {
      fetch(`${API_BASE}/api/v1/auth/me`, { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('unauthorized'))))
        .then((d) => {
          if (d.user) {
            setUser(d.user)
            localStorage.setItem('sos_user', JSON.stringify(d.user))
          }
        })
        .catch(() => {
          localStorage.removeItem('sos_token')
          localStorage.removeItem('sos_user')
        })
    }

    fetch(`${API_BASE}/api/v1/summary`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        setLiveMetrics([
          { label: 'Active students', value: data.total_students ? data.total_students.toString() : '546', detail: 'From live Vidyuth database' },
          { label: 'Roll call complete', value: data.roll_call_pct || '94.2%', detail: 'Updated from live backend' },
          { label: 'Receivables due', value: data.fee_receivables || '₹59,51,000', detail: 'Calculated from fee records' },
          { label: 'Open staff cover', value: data.open_staff_cover ? data.open_staff_cover.toString() : '4', detail: 'Substitutions required today' },
        ])
      })
      .catch(() => {
        // Fallback to local constants
      })

    fetch(`${API_BASE}/api/v1/school/profile`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setSchoolProfile(data)
      })
      .catch(() => {})

    fetch(`${API_BASE}/api/v1/school/settings`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data) setSystemSettings(data)
      })
      .catch(() => {})

    fetch(`${API_BASE}/api/v1/fees/receipts`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecentReceipts(data)
      })
      .catch(() => {})

    fetch(`${API_BASE}/api/v1/students?query=${encodeURIComponent(query)}`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((s: any) => ({
            id: s.admission_number,
            name: s.student_name,
            grade: `${s.class_name || s.class || ''} ${s.section || ''}`.trim(),
            attendance: '95%',
            balance: `₹${s.outstanding_amount || 0}`,
            status: s.fee_status === 'Paid' ? 'Clear' : s.fee_status === 'Partially Paid' ? 'Review' : 'Due'
          }))
          setLiveStudents(mapped)
        }
      })
      .catch(() => {})
  }, [query])

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/school/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(schoolProfile)
      })
      if (res.ok) {
        setActivity(`School Profile saved: ${schoolProfile.name}`)
        alert('School Profile updated successfully!')
      }
    } catch {
      alert('Error updating school profile')
    }
  }

  const handleSaveSettings = async () => {
    try {
      const payload: Record<string, string> = {}
      Object.keys(systemSettings).forEach((k) => {
        payload[k] = typeof systemSettings[k] === 'object' ? systemSettings[k].value : systemSettings[k]
      })
      const res = await fetch(`${API_BASE}/api/v1/school/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setActivity('Gateway & Academic settings updated in SQLite database')
        alert('Settings saved successfully!')
      }
    } catch {
      alert('Error updating settings')
    }
  }

  const handleValidateCSV = async (commit: boolean) => {
    const lines = importerText.trim().split('\n')
    if (lines.length < 2) {
      alert('Please enter header row and at least one student row.')
      return
    }
    const headers = lines[0].split(',').map((h) => h.trim())
    const rows = lines.slice(1).map((line) => {
      const parts = line.split(',').map((p) => p.trim())
      const obj: any = {}
      headers.forEach((h, i) => { obj[h] = parts[i] || '' })
      return obj
    })

    try {
      const res = await fetch(`${API_BASE}/api/v1/import/students`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ rows, commit })
      })
      const data = await res.json()
      setImportResults(data)
      if (commit) {
        setActivity(`Imported ${data.valid_count} students into database!`)
        alert(`Successfully imported ${data.valid_count} students into School OS database!`)
      }
    } catch {
      alert('Error connecting to import service')
    }
  }

  const handleCreateSnapshot = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/backup/create`, { method: 'POST' })
      const data = await res.json()
      setActivity(`Snapshot created: ${data.filename}`)
      fetch(`${API_BASE}/api/v1/backup/list`, { headers: authHeaders() })
        .then((r) => r.json())
        .then((d) => { if (d.snapshots) setBackupSnapshots(d.snapshots) })
    } catch {
      alert('Error creating backup snapshot')
    }
  }

  const filteredStudents = useMemo(
    () => liveStudents,
    [liveStudents],
  )

  const handleViewReportCard = async (studentId: string = 'VIS-2026-0048') => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/report-card/${studentId}`, { headers: authHeaders() })
      const data = await res.json()
      if (data && data.scholastic_subjects) {
        setReportCardData(data)
        setShowReportCardModal(true)
        setActivity(`Official CBSE Mark Sheet loaded for ${data.student_name}`)
      } else {
        alert('Failed to load official report card')
      }
    } catch {
      alert('Error fetching report card from school server')
    }
  }

  const handleOpenFeeModal = (student?: any) => {
    const fallbackList = liveStudents && liveStudents.length > 0 ? liveStudents : students
    const target = student || fallbackList.find((s) => s.status === 'Due') || fallbackList[1] || fallbackList[0]
    setFeeTargetStudent(target)
    setFeeAmount(target?.balance ? target.balance.replace(/[^\d]/g, '') : '14200')
    setFeeReceiptData(null)
    setShowFeeModal(true)
  }

  const handleCollectFee = async () => {
    const fallbackList = liveStudents && liveStudents.length > 0 ? liveStudents : students
    const st = feeTargetStudent || fallbackList.find((s) => s.status === 'Due') || fallbackList[0]
    const amt = parseFloat(feeAmount) || 14200

    try {
      const res = await fetch(`${API_BASE}/api/v1/fees/collect`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          admission_number: st.id || 'VIS-2026-0048',
          amount: amt,
          payment_mode: feePaymentMode,
          reference_no: `UPI-${Date.now()}`
        })
      })
      const data = await res.json()
      if (res.ok && data.status === 'SUCCESS') {
        setFeeReceiptData(data)
        setActivity(`Fee collected: ₹${amt} for ${st.name || data.student_name}. Receipt: ${data.receipt_number}`)
        setLiveStudents((prev) =>
          prev.map((s) => {
            if (s.id === (st.id || data.admission_number)) {
              const remaining = data.remaining_balance
              return {
                ...s,
                balance: `₹${remaining}`,
                status: remaining <= 0 ? 'Clear' : 'Review'
              }
            }
            return s
          })
        )
      } else {
        alert(data.error || 'Failed to process fee collection')
      }
    } catch {
      alert('Error connecting to fee collection gateway')
    }
  }

  const handleOpenMarksModal = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/marks/class?class=Grade%2010&section=A&subject=Mathematics&exam=PT1`, { headers: authHeaders() })
      const data = await res.json()
      if (data && Array.isArray(data.students) && data.students.length > 0) {
        setMarksRoster(data.students)
        setShowMarksModal(true)
      } else {
        throw new Error('Empty roster')
      }
    } catch {
      setMarksRoster(students.map((s, idx) => ({
        student_id: idx + 1,
        admission_number: s.id,
        student_name: s.name,
        roll_number: idx + 1,
        marks_obtained: idx === 0 ? 95 : 85,
        max_marks: 100,
        grade: idx === 0 ? 'A1' : 'A2'
      })))
      setShowMarksModal(true)
    }
  }

  const handleUpdateMark = (admissionNumber: string, marksObtained: number) => {
    setMarksRoster((prev) =>
      prev.map((m) => {
        if (m.admission_number === admissionNumber) {
          const pct = (marksObtained / (m.max_marks || 100)) * 100
          let grd = 'E'
          if (pct >= 91) grd = 'A1'
          else if (pct >= 81) grd = 'A2'
          else if (pct >= 71) grd = 'B1'
          else if (pct >= 61) grd = 'B2'
          else if (pct >= 51) grd = 'C1'
          else if (pct >= 41) grd = 'C2'
          else if (pct >= 33) grd = 'D'
          return { ...m, marks_obtained: marksObtained, grade: grd }
        }
        return m
      })
    )
  }

  const handleSaveMarks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/marks/submit`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          class: 'Grade 10',
          section: 'A',
          subject: 'Mathematics',
          examination: 'PT1',
          marks: marksRoster
        })
      })
      const data = await res.json()
      if (res.ok) {
        setShowMarksModal(false)
        setActivity(data.message || 'Term 1 Marks entry saved for Grade 10A Mathematics! Logged in academic records.')
      }
    } catch {
      setShowMarksModal(false)
      setActivity('Marks saved in offline session.')
    }
  }

  const handleRePrintReceipt = (rec: any) => {
    setFeeReceiptData({
      receipt_number: rec.receipt_number,
      student_name: rec.student_name,
      admission_number: rec.admission_number,
      amount_paid: rec.amount_paid,
      remaining_balance: rec.remaining_balance,
      payment_mode: rec.payment_mode,
      reference_no: rec.reference_no,
      timestamp: rec.created_at
    })
    setShowFeeModal(true)
  }

  const handleQuickLogin = async (role: PersonaRole, username?: string) => {
    const uname = (username || lockUsername).trim()
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, password: lockPassword })
      })
      const data = await res.json()
      if (res.ok && data.status === 'SUCCESS' && data.token) {
        localStorage.setItem('sos_token', data.token)
        localStorage.setItem('sos_user', JSON.stringify(data.user))
        setUser(data.user)
        setPersona(role)
        setShowLockModal(false)
        setLockPassword('')
        setActivity(`Authenticated as ${data.user?.full_name || uname} (${role})`)
      } else {
        setActivity(data.error || 'Authentication failed')
        alert(data.error || 'Invalid username or password')
      }
    } catch {
      alert('Error connecting to authentication service')
    }
  }

  const handleLogout = () => {
    const token = getStoredToken()
    if (token) {
      fetch(`${API_BASE}/api/v1/auth/logout`, { method: 'POST', headers: authHeaders() }).catch(() => {})
    }
    localStorage.removeItem('sos_token')
    localStorage.removeItem('sos_user')
    setUser(null)
    setActivity('Session locked. Authenticate to continue.')
  }

  const handleAction = (label: string) => {
    if (label === 'Fast Attendance (<20s)') {
      setShowAttendanceModal(true)
      return
    }
    if (label === 'Record payment') {
      handleOpenFeeModal()
      return
    }
    setActivity(`${label} opened`)
  }

  const toggleStatus = (id: string) => {
    setAttendanceState((prev) => {
      const current = prev[id] || 'Present'
      const next = current === 'Present' ? 'Absent' : current === 'Absent' ? 'Late' : 'Present'
      return { ...prev, [id]: next }
    })
  }

  const submitAttendance = () => {
    const payload = {
      class: 'Grade 10',
      section: 'A',
      absentees: Object.entries(attendanceState).filter(([_, s]) => s === 'Absent').map(([id]) => id),
      records: attendanceState
    }

    fetch(`${API_BASE}/api/v1/attendance/submit`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
      .then((r) => r.json())
      .then((resp) => {
        setShowAttendanceModal(false)
        setActivity(`Roll-call saved via live API: ${resp.message}. Outbox logged.`)
      })
      .catch(() => {
        setShowAttendanceModal(false)
        setActivity('Roll call submitted for Grade 10A (offline mode).')
      })
  }


  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark">CG</span>
          <span>CampusGrid</span>
        </div>

        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              className={activeNav === label ? 'nav-item active' : 'nav-item'}
              key={label}
              onClick={() => setActiveNav(label)}
              type="button"
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className="settings-button" onClick={() => setShowSettingsModal(true)} type="button">
          <Settings size={17} />
          <span>School Settings</span>
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>{activeNav}</h1>
            <p>Academic year {schoolProfile.academic_year} · {schoolProfile.name}, {schoolProfile.city}</p>
          </div>

          <div className="topbar-actions">
            <div className="search-box-wrapper" onClick={() => setShowPalette(true)}>
              <label className="search-box">
                <Search size={16} />
                <input
                  aria-label="Search students"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search students, classes, actions..."
                  value={query}
                />
                <kbd className="kbd-shortcut">Ctrl K</kbd>
              </label>
            </div>
            <select
              aria-label="Active persona role"
              className="persona-selector"
              onChange={(e) => {
                const p = e.target.value as PersonaRole
                if (!user) {
                  setLockUsername(p === 'Principal' ? 'admin' : p === 'Teacher' ? 'teacher' : p === 'Accountant' ? 'accountant' : 'parent')
                  setShowLockModal(true)
                  setActivity(`Role ${p} selected: authenticate to switch`)
                  return
                }
                setPersona(p)
                setActivity(`Switched role to ${p}`)
              }}
              value={persona}
            >
              <option value="Principal">Role: Principal</option>
              <option value="Teacher">Role: Teacher</option>
              <option value="Parent">Role: Parent</option>
              <option value="Accountant">Role: Accountant</option>
            </select>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Bell size={17} />
            </button>
            <button
              className="icon-button"
              id="btn-lock-session"
              onClick={() => {
                if (user) handleLogout()
                setShowLockModal(true)
              }}
              title={user ? 'Lock session (logout)' : 'Authenticate session'}
              type="button"
            >
              {user ? <ShieldCheck size={16} /> : <Key size={16} />}
            </button>
            <button className="profile-button" onClick={() => setShowLockModal(true)} type="button">
              <span>{persona.slice(0, 2).toUpperCase()}</span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <div className="mobile-brand">
          <span className="brand-mark">CG</span>
          <span>CampusGrid</span>
        </div>

        <section className="command-row" aria-label="Quick actions">
          {[
            { label: 'Fast Attendance (<20s)', icon: Zap },
            { label: 'New admission', icon: Plus },
            { label: 'Record payment', icon: CreditCard },
            { label: 'Send notice', icon: Send },
          ].map(({ label, icon: Icon }) => (
            <button
              className={label === 'Fast Attendance (<20s)' ? 'action-button primary-highlight' : 'action-button'}
              key={label}
              onClick={() => handleAction(label)}
              type="button"
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
          <span className="activity-note">{activity}</span>
        </section>

        <section className="metric-grid" aria-label="School summary">
          {liveMetrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </article>
          ))}
        </section>

        {/* ─── NAV-DRIVEN VIEWS ─────────────────────────────────────────── */}

        {activeNav === 'Dashboard' && (
          <>
            {persona === 'Teacher' ? (
              <section className="persona-view teacher-view">
                <div className="persona-banner">
                  <h2>👩‍🏫 Teacher Workspace — Classes &amp; Attendance</h2>
                  <p>Welcome back! You have 4 classes scheduled today at {schoolProfile.name}.</p>
                </div>
                <div className="teacher-grid">
                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Today's Assigned Classes</h3>
                        <p>Immediate attendance and mark entry actions</p>
                      </div>
                    </div>
                    <div className="teacher-class-list">
                      {[
                        { grade: 'Grade 10A', subject: 'Mathematics', time: '08:30 - 09:15', room: 'Room 302', attStatus: 'Pending' },
                        { grade: 'Grade 9B', subject: 'Mathematics', time: '09:20 - 10:05', room: 'Room 204', attStatus: 'Done (94%)' },
                        { grade: 'Grade 8C', subject: 'Physics Lab', time: '11:15 - 12:00', room: 'Physics Lab', attStatus: 'Pending' },
                        { grade: 'Grade 10B', subject: 'Mathematics', time: '14:00 - 14:45', room: 'Room 304', attStatus: 'Pending' },
                      ].map((c) => (
                        <div className="teacher-class-item" key={c.grade + c.time}>
                          <div>
                            <strong>{c.grade} — {c.subject}</strong>
                            <small>{c.time} · {c.room}</small>
                          </div>
                          <div className="teacher-class-actions">
                            <span className={`badge-pill ${c.attStatus.includes('Done') ? 'pill-green' : 'pill-yellow'}`}>
                              {c.attStatus}
                            </span>
                            <button
                              className="btn-action-sm"
                              onClick={() => setShowAttendanceModal(true)}
                              type="button"
                            >
                              <Zap size={14} />
                              Roll Call
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Pending Marks Entry</h3>
                        <p>Term 1 Periodic Test (PT1)</p>
                      </div>
                      <button
                        className="btn-action-sm"
                        id="btn-teacher-enter-marks"
                        onClick={handleOpenMarksModal}
                        type="button"
                      >
                        <FileSpreadsheet size={14} />
                        Enter Marks
                      </button>
                    </div>
                    <div className="timeline-list">
                      <div className="timeline-item">
                        <time>PT1</time>
                        <div>
                          <strong>Grade 10A — Mathematics</strong>
                          <span>28 / 38 papers graded</span>
                        </div>
                        <em>Due Tomorrow</em>
                      </div>
                      <div className="timeline-item">
                        <time>PT1</time>
                        <div>
                          <strong>Grade 9B — Mathematics</strong>
                          <span>35 / 35 papers graded</span>
                        </div>
                        <em style={{ color: '#10b981' }}>Completed</em>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : persona === 'Parent' ? (
              <section className="persona-view parent-view">
                <div className="persona-banner parent-banner">
                  <h2>👨‍👩‍👧 Parent Portal — Aarav Mehta (Grade 8A)</h2>
                  <p>Admission No: VIS-2026-0048 · Academic Year 2026-27</p>
                </div>
                <div className="content-grid">
                  <article className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Attendance Summary</h3>
                        <p>Current Term: 96% attendance</p>
                      </div>
                      <ClipboardCheck size={20} />
                    </div>
                    <div style={{ padding: '16px 0' }}>
                      <p>Aarav was present for <strong>88 of 92</strong> school days this term.</p>
                      <small style={{ color: '#10b981', fontWeight: 600 }}>✓ Meets mandatory 75% CBSE requirement</small>
                    </div>
                  </article>

                  <article className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Fee Payment Status</h3>
                        <p>Term 2 Tuition &amp; Transport</p>
                      </div>
                      <CircleDollarSign size={20} />
                    </div>
                    <div style={{ padding: '16px 0' }}>
                      <p>All current term dues are <strong>Cleared (₹0 balance)</strong>.</p>
                      <small style={{ color: '#64748b' }}>Next Term Fee Due Date: 15th October 2026</small>
                    </div>
                  </article>

                  <article className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Report Card &amp; Results</h3>
                        <p>Periodic Test 1 (PT1)</p>
                      </div>
                      <FileBarChart size={20} />
                    </div>
                    <div style={{ padding: '16px 0' }}>
                      <p>Aggregate Score: <strong>88.0% (Grade A2)</strong></p>
                      <small>Mathematics: A1 (95%) · Science: A1 (91%) · English: A2 (88%)</small>
                      <div style={{ marginTop: '14px' }}>
                        <button
                          className="btn-action-sm"
                          id="btn-parent-report-card"
                          onClick={() => handleViewReportCard('VIS-2026-0048')}
                          type="button"
                        >
                          <FileBarChart size={14} />
                          View Official CBSE Mark Sheet
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
            ) : persona === 'Accountant' ? (
              <section className="persona-view accountant-view">
                <div className="persona-banner accountant-banner">
                  <h2>💳 Accounts &amp; Fee Reconciliation Center</h2>
                  <p>{schoolProfile.name} · Daily Collections &amp; Aging Matrix</p>
                </div>
                <div className="content-grid">
                  <article className="panel fees-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Collections &amp; Receivables</h2>
                        <p>Term-wise aging breakdown</p>
                      </div>
                      <button
                        className="btn-action-sm"
                        id="btn-accountant-collect-fee"
                        onClick={() => handleOpenFeeModal()}
                        type="button"
                      >
                        <CreditCard size={14} />
                        Record Payment
                      </button>
                    </div>
                    <div className="aging-list">
                      {feeAging.map((item, index) => (
                        <div className="aging-row" key={item.label}>
                          <span className={`severity severity-${index + 1}`} />
                          <div>
                            <strong>{item.label}</strong>
                            <small>{item.count} invoices</small>
                          </div>
                          <b>{item.amount}</b>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Concession Policy Overview</h2>
                        <p>Registered Fee Schemes</p>
                      </div>
                    </div>
                    <div className="timeline-list">
                      <div className="timeline-item">
                        <time>25%</time>
                        <div>
                          <strong>Sibling Concession</strong>
                          <span>42 active student concessions</span>
                        </div>
                        <em>Auto-applied</em>
                      </div>
                      <div className="timeline-item">
                        <time>100%</time>
                        <div>
                          <strong>RTE Quota Allocation</strong>
                          <span>28 students enrolled under RTE Section 12</span>
                        </div>
                        <em>Govt Subsidized</em>
                      </div>
                    </div>
                  </article>

                  <article className="panel daybook-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Cashier Day-Book &amp; Issued Receipts</h2>
                        <p>{recentReceipts.length} collections reconciled today in local database</p>
                      </div>
                      <button className="btn-action-sm" onClick={() => handleOpenFeeModal()} type="button">
                        <CreditCard size={14} />
                        New Payment
                      </button>
                    </div>
                    <table className="daybook-table">
                      <thead>
                        <tr>
                          <th>Receipt #</th>
                          <th>Student Details</th>
                          <th>Payment Mode</th>
                          <th>Amount Paid</th>
                          <th>Timestamp</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentReceipts.map((r: any) => (
                          <tr key={r.receipt_number || r.id}>
                            <td><strong>{r.receipt_number}</strong></td>
                            <td>
                              <strong>{r.student_name}</strong>
                              <small style={{ display: 'block', color: '#64748b' }}>{r.admission_number}</small>
                            </td>
                            <td><span className="badge-status" style={{ color: '#0f5f59' }}>{r.payment_mode}</span></td>
                            <td><strong style={{ color: '#16a34a' }}>₹{Number(r.amount_paid).toLocaleString('en-IN')}</strong></td>
                            <td>{new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td>
                              <button
                                className="tc-action-btn"
                                id={`btn-reprint-${r.receipt_number?.replace(/\//g, '-')}`}
                                onClick={() => handleRePrintReceipt(r)}
                                type="button"
                              >
                                <Printer size={12} />
                                Re-Print
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </article>
                </div>
              </section>
            ) : (
              <section className="content-grid">
                <article className="panel attendance-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Attendance</h2>
                      <p>Roll-call status by grade</p>
                    </div>
                    <div className="segmented" aria-label="Attendance period">
                      {['Today', 'Week'].map((item) => (
                        <button
                          className={period === item ? 'selected' : ''}
                          key={item}
                          onClick={() => setPeriod(item)}
                          type="button"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="attendance-table">
                    <div className="compact-row compact-head">
                      <span>Grade</span>
                      <span>Sections</span>
                      <span>Absent</span>
                      <span>Late</span>
                      <span>Rate</span>
                    </div>
                    {attendanceRows.map((row) => (
                      <div className="compact-row" key={row.grade}>
                        <span>{row.grade}</span>
                        <span>{row.submitted}/{row.sections}</span>
                        <span>{row.absent}</span>
                        <span>{row.late}</span>
                        <span className="rate-cell">
                          <i style={{ width: `${row.rate}%` }} />
                          <strong>{row.rate}%</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel fees-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Fees due</h2>
                      <p>Aging and follow-up workload</p>
                    </div>
                    <CircleDollarSign size={20} />
                  </div>
                  <div className="aging-list">
                    {feeAging.map((item, index) => (
                      <div className="aging-row" key={item.label}>
                        <span className={`severity severity-${index + 1}`} />
                        <div>
                          <strong>{item.label}</strong>
                          <small>{item.count} invoices</small>
                        </div>
                        <b>{item.amount}</b>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel timetable-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Timetable</h2>
                      <p>Rooms and substitutions</p>
                    </div>
                    <CalendarDays size={20} />
                  </div>
                  <div className="timeline-list">
                    {timetable.map((slot) => (
                      <div className="timeline-item" key={`${slot.time}-${slot.className}`}>
                        <time>{slot.time}</time>
                        <div>
                          <strong>{slot.className}</strong>
                          <span>{slot.room} · {slot.teacher}</span>
                        </div>
                        <em>{slot.note}</em>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel announcement-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Announcements</h2>
                      <p>Published and scheduled notices</p>
                    </div>
                    <MessageSquareText size={20} />
                  </div>
                  <div className="notice-list">
                    {announcements.map((notice) => (
                      <button key={notice} type="button">{notice}</button>
                    ))}
                  </div>
                </article>

                <article className="panel student-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Student Directory</h2>
                      <p>{filteredStudents.length} records in view</p>
                    </div>
                    <button className="text-button" onClick={() => setQuery('Due')} type="button">
                      Fees due
                    </button>
                  </div>
                  <div className="student-table" role="table" aria-label="Student Directory">
                    <div className="table-row table-head" role="row">
                      <span role="columnheader">ID</span>
                      <span role="columnheader">Student</span>
                      <span role="columnheader">Class</span>
                      <span role="columnheader">Attendance</span>
                      <span role="columnheader">Balance</span>
                      <span role="columnheader">Status</span>
                      <span role="columnheader">Action</span>
                    </div>
                    {filteredStudents.map((student) => (
                      <div className="table-row" role="row" key={student.id}>
                        <span role="cell">{student.id}</span>
                        <span role="cell">{student.name}</span>
                        <span role="cell">{student.grade}</span>
                        <span role="cell">{student.attendance}</span>
                        <span role="cell">{student.balance}</span>
                        <span className={`status ${student.status.toLowerCase()}`} role="cell">
                          {student.status}
                        </span>
                        <span role="cell" style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="tc-action-btn"
                            onClick={() => {
                              setTcTargetStudent(student)
                              setShowTCModal(true)
                            }}
                            type="button"
                          >
                            Issue TC
                          </button>
                          {student.balance !== '₹0' && (
                            <button
                              className="tc-action-btn"
                              onClick={() => handleOpenFeeModal(student)}
                              type="button"
                              style={{ background: '#fef3c7', borderColor: '#fde047', color: '#854d0e' }}
                            >
                              Collect
                            </button>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            )}
          </>
        )}

        {activeNav === 'Students' && (
          <section className="content-grid">
            <article className="panel student-panel" style={{ gridColumn: '1 / -1' }}>
              <div className="panel-heading">
                <div>
                  <h2>Student Directory</h2>
                  <p>{liveStudents.length} enrolled students · Academic Year {schoolProfile.academic_year}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="text-button" onClick={() => setQuery('Due')} type="button">Fee defaulters</button>
                  <button className="text-button" onClick={() => setQuery('')} type="button">All students</button>
                  <button className="btn-action-sm" onClick={() => handleOpenFeeModal()} type="button">
                    <Plus size={14} />
                    New Admission
                  </button>
                </div>
              </div>
              <div className="student-table" role="table" aria-label="Student Directory">
                <div className="table-row table-head" role="row">
                  <span role="columnheader">Adm. No.</span>
                  <span role="columnheader">Student Name</span>
                  <span role="columnheader">Class</span>
                  <span role="columnheader">Attendance</span>
                  <span role="columnheader">Outstanding</span>
                  <span role="columnheader">Status</span>
                  <span role="columnheader">Actions</span>
                </div>
                {filteredStudents.map((student) => (
                  <div className="table-row" role="row" key={student.id}>
                    <span role="cell"><strong>{student.id}</strong></span>
                    <span role="cell">{student.name}</span>
                    <span role="cell">{student.grade}</span>
                    <span role="cell">{student.attendance}</span>
                    <span role="cell">{student.balance}</span>
                    <span className={`status ${student.status.toLowerCase()}`} role="cell">{student.status}</span>
                    <span role="cell" style={{ display: 'flex', gap: '4px' }}>
                      <button className="tc-action-btn" onClick={() => handleViewReportCard(student.id)} type="button">
                        <FileBarChart size={12} /> Report Card
                      </button>
                      <button className="tc-action-btn" onClick={() => { setTcTargetStudent(student); setShowTCModal(true) }} type="button">
                        Issue TC
                      </button>
                      {student.balance !== '₹0' && (
                        <button
                          className="tc-action-btn"
                          onClick={() => handleOpenFeeModal(student)}
                          type="button"
                          style={{ background: '#fef3c7', borderColor: '#fde047', color: '#854d0e' }}
                        >
                          Collect
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeNav === 'Classes' && (
          <section className="content-grid">
            <article className="panel timetable-panel">
              <div className="panel-heading">
                <div><h2>Today's Timetable</h2><p>Active sessions and room assignments</p></div>
                <CalendarDays size={20} />
              </div>
              <div className="timeline-list">
                {timetable.map((slot) => (
                  <div className="timeline-item" key={`${slot.time}-${slot.className}`}>
                    <time>{slot.time}</time>
                    <div>
                      <strong>{slot.className}</strong>
                      <span>{slot.room} · {slot.teacher}</span>
                    </div>
                    <em>{slot.note}</em>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><h2>Class Roster</h2><p>Sections and strength this term</p></div>
              </div>
              <div className="timeline-list">
                {[
                  { grade: 'Grade 6', sections: 4, strength: 156, classTeacher: 'Ms. Priya Nair' },
                  { grade: 'Grade 7', sections: 5, strength: 197, classTeacher: 'Mr. Rajan Pillai' },
                  { grade: 'Grade 8', sections: 5, strength: 188, classTeacher: 'Ms. Deepa Menon' },
                  { grade: 'Grade 9', sections: 4, strength: 162, classTeacher: 'Mr. Venkat Rao' },
                  { grade: 'Grade 10', sections: 4, strength: 148, classTeacher: 'Dr. Sunita Bhat' },
                ].map((c) => (
                  <div className="timeline-item" key={c.grade}>
                    <time>{c.sections}§</time>
                    <div>
                      <strong>{c.grade}</strong>
                      <span>{c.strength} students · CT: {c.classTeacher}</span>
                    </div>
                    <em style={{ color: '#0ea5e9' }}>Active</em>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><h2>Substitution Requests</h2><p>Open cover slots today</p></div>
              </div>
              <div className="timeline-list">
                {[
                  { grade: 'Grade 7C', period: 'Period 3 (10:15)', reason: 'Ms. Lakshmi on leave', cover: 'Mr. Reddy assigned' },
                  { grade: 'Grade 9A', period: 'Period 5 (12:30)', reason: 'Mr. Sharma on duty', cover: 'Awaiting assignment' },
                ].map((s) => (
                  <div className="timeline-item" key={s.grade + s.period}>
                    <time>SUB</time>
                    <div>
                      <strong>{s.grade} · {s.period}</strong>
                      <span>{s.reason}</span>
                    </div>
                    <em style={{ color: s.cover.includes('Awaiting') ? '#f59e0b' : '#10b981' }}>{s.cover}</em>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeNav === 'Attendance' && (
          <section className="content-grid">
            <article className="panel attendance-panel" style={{ gridColumn: '1 / -1' }}>
              <div className="panel-heading">
                <div><h2>Attendance Overview</h2><p>Daily roll-call status across all grades</p></div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="segmented" aria-label="Attendance period">
                    {['Today', 'Week'].map((item) => (
                      <button className={period === item ? 'selected' : ''} key={item} onClick={() => setPeriod(item)} type="button">{item}</button>
                    ))}
                  </div>
                  <button className="btn-action-sm" onClick={() => setShowAttendanceModal(true)} type="button">
                    <Zap size={14} /> Fast Roll Call
                  </button>
                </div>
              </div>
              <div className="attendance-table">
                <div className="compact-row compact-head">
                  <span>Grade</span><span>Sections</span><span>Absent</span><span>Late</span><span>Rate</span>
                </div>
                {attendanceRows.map((row) => (
                  <div className="compact-row" key={row.grade}>
                    <span>{row.grade}</span>
                    <span>{row.submitted}/{row.sections}</span>
                    <span>{row.absent}</span>
                    <span>{row.late}</span>
                    <span className="rate-cell">
                      <i style={{ width: `${row.rate}%` }} />
                      <strong>{row.rate}%</strong>
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><h2>Chronic Absentees</h2><p>Below 75% this term — CBSE threshold</p></div>
              </div>
              <div className="timeline-list">
                {[
                  { name: 'Saanvi Sharma', id: 'VIS-2026-0217', grade: '6A', pct: '78%', days: 14 },
                  { name: 'Priya Nair', id: 'VIS-2026-0402', grade: '10A', pct: '84%', days: 10 },
                ].map((s) => (
                  <div className="timeline-item" key={s.id}>
                    <time style={{ color: '#ef4444' }}>{s.pct}</time>
                    <div><strong>{s.name} · {s.grade}</strong><span>{s.days} absences · {s.id}</span></div>
                    <em style={{ color: '#f59e0b' }}>Notice pending</em>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><h2>Submission Status</h2><p>Sections yet to submit today</p></div>
              </div>
              <div className="timeline-list">
                {[
                  { section: 'Grade 7D', teacher: 'Ms. Anita Verma', time: 'Overdue by 45 min' },
                  { section: 'Grade 8B', teacher: 'Mr. Suresh Kumar', time: 'Overdue by 20 min' },
                  { section: 'Grade 8E', teacher: 'Ms. Lakshmi Iyer', time: 'Submitted on leave' },
                ].map((s) => (
                  <div className="timeline-item" key={s.section}>
                    <time style={{ color: '#ef4444' }}>⚠</time>
                    <div><strong>{s.section}</strong><span>{s.teacher}</span></div>
                    <em style={{ color: '#ef4444' }}>{s.time}</em>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeNav === 'Fees' && (
          <section className="content-grid">
            <article className="panel fees-panel">
              <div className="panel-heading">
                <div><h2>Fee Aging Matrix</h2><p>Outstanding dues by overdue period</p></div>
                <button className="btn-action-sm" onClick={() => handleOpenFeeModal()} type="button">
                  <CreditCard size={14} /> Record Payment
                </button>
              </div>
              <div className="aging-list">
                {feeAging.map((item, index) => (
                  <div className="aging-row" key={item.label}>
                    <span className={`severity severity-${index + 1}`} />
                    <div><strong>{item.label}</strong><small>{item.count} invoices</small></div>
                    <b>{item.amount}</b>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><h2>Concession Schemes</h2><p>Active fee waivers &amp; discounts</p></div>
              </div>
              <div className="timeline-list">
                <div className="timeline-item"><time>25%</time><div><strong>Sibling Concession</strong><span>42 active concessions</span></div><em>Auto-applied</em></div>
                <div className="timeline-item"><time>100%</time><div><strong>RTE Quota</strong><span>28 students under RTE Section 12</span></div><em>Govt Subsidized</em></div>
                <div className="timeline-item"><time>50%</time><div><strong>Staff Ward Discount</strong><span>14 staff children enrolled</span></div><em>HR Approved</em></div>
              </div>
            </article>

            <article className="panel daybook-panel" style={{ gridColumn: '1 / -1' }}>
              <div className="panel-heading">
                <div><h2>Cashier Day-Book</h2><p>{recentReceipts.length} collections today</p></div>
                <button className="btn-action-sm" onClick={() => handleOpenFeeModal()} type="button">
                  <CreditCard size={14} /> New Payment
                </button>
              </div>
              <table className="daybook-table">
                <thead><tr><th>Receipt #</th><th>Student</th><th>Mode</th><th>Amount</th><th>Time</th><th>Action</th></tr></thead>
                <tbody>
                  {recentReceipts.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>No collections yet. Use "Record Payment" to begin.</td></tr>
                  ) : recentReceipts.map((r: any) => (
                    <tr key={r.receipt_number || r.id}>
                      <td><strong>{r.receipt_number}</strong></td>
                      <td><strong>{r.student_name}</strong><small style={{ display: 'block', color: '#64748b' }}>{r.admission_number}</small></td>
                      <td><span className="badge-status" style={{ color: '#0f5f59' }}>{r.payment_mode}</span></td>
                      <td><strong style={{ color: '#16a34a' }}>₹{Number(r.amount_paid).toLocaleString('en-IN')}</strong></td>
                      <td>{new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td><button className="tc-action-btn" onClick={() => handleRePrintReceipt(r)} type="button"><Printer size={12} /> Re-Print</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>
        )}

        {activeNav === 'Staff' && (
          <section className="content-grid">
            <article className="panel" style={{ gridColumn: '1 / -1' }}>
              <div className="panel-heading">
                <div><h2>Staff Directory</h2><p>Teaching &amp; non-teaching personnel</p></div>
                <button className="btn-action-sm" type="button"><Plus size={14} /> Add Staff</button>
              </div>
              <div className="student-table" role="table" aria-label="Staff Directory">
                <div className="table-row table-head" role="row">
                  <span role="columnheader">Employee ID</span>
                  <span role="columnheader">Name</span>
                  <span role="columnheader">Department</span>
                  <span role="columnheader">Designation</span>
                  <span role="columnheader">Contact</span>
                  <span role="columnheader">Status</span>
                </div>
                {[
                  { id: 'VIS-STF-001', name: 'Dr. Radhika Sharma', dept: 'Administration', role: 'Principal', phone: '+91 98490 10001', status: 'Active' },
                  { id: 'VIS-STF-002', name: 'Mr. Rajan Pillai', dept: 'Mathematics', role: 'Sr. Teacher', phone: '+91 98490 10002', status: 'Active' },
                  { id: 'VIS-STF-003', name: 'Ms. Deepa Menon', dept: 'Science', role: 'Teacher', phone: '+91 98490 10003', status: 'Active' },
                  { id: 'VIS-STF-004', name: 'Ms. Anita Verma', dept: 'English', role: 'Teacher', phone: '+91 98490 10004', status: 'On Leave' },
                  { id: 'VIS-STF-005', name: 'Mr. Venkat Rao', dept: 'Social Studies', role: 'Teacher', phone: '+91 98490 10005', status: 'Active' },
                  { id: 'VIS-STF-006', name: 'Ms. Lakshmi Iyer', dept: 'Hindi', role: 'Teacher', phone: '+91 98490 10006', status: 'Active' },
                ].map((s) => (
                  <div className="table-row" role="row" key={s.id}>
                    <span role="cell"><strong>{s.id}</strong></span>
                    <span role="cell">{s.name}</span>
                    <span role="cell">{s.dept}</span>
                    <span role="cell">{s.role}</span>
                    <span role="cell">{s.phone}</span>
                    <span className={`status ${s.status === 'Active' ? 'clear' : 'review'}`} role="cell">{s.status}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><h2>Leave Requests</h2><p>Pending principal approval</p></div>
              </div>
              <div className="timeline-list">
                <div className="timeline-item"><time>3d</time><div><strong>Ms. Anita Verma · English</strong><span>Medical leave · 14–16 Sep 2026</span></div><em style={{ color: '#f59e0b' }}>Pending</em></div>
                <div className="timeline-item"><time>1d</time><div><strong>Mr. Suresh Kumar · PE</strong><span>Casual leave · 18 Sep 2026</span></div><em style={{ color: '#10b981' }}>Approved</em></div>
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><h2>Payroll Summary</h2><p>September 2026 disbursement</p></div>
              </div>
              <div className="timeline-list">
                <div className="timeline-item"><time>42</time><div><strong>Total Staff on Payroll</strong><span>38 teaching · 4 non-teaching</span></div><em>₹28,40,000</em></div>
                <div className="timeline-item"><time>Sep</time><div><strong>Disbursement Status</strong><span>Scheduled for 28 Sep 2026</span></div><em style={{ color: '#f59e0b' }}>Pending</em></div>
              </div>
            </article>
          </section>
        )}

        {activeNav === 'Messages' && (
          <section className="content-grid">
            <article className="panel announcement-panel">
              <div className="panel-heading">
                <div><h2>Broadcast Notices</h2><p>Published school-wide announcements</p></div>
                <button className="btn-action-sm" type="button"><Send size={14} /> New Notice</button>
              </div>
              <div className="notice-list">
                {[
                  'Bus route 4 delayed by 12 minutes — Parents notified via SMS',
                  'Parent-teacher meeting slots published — Booking open till 15 Sep',
                  'Science fair registration closes today at 5:00 PM',
                  'Annual Sports Day — 28 September 2026 · All students to report by 8:00 AM',
                  'CBSE Board exam schedule released — Grade 10 & 12 students check portal',
                ].map((notice) => (
                  <button key={notice} type="button">{notice}</button>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><h2>SMS / WhatsApp Log</h2><p>Last 24 hours outbox</p></div>
              </div>
              <div className="timeline-list">
                {[
                  { type: 'SMS', msg: 'Fee receipt sent to Maya Reddy parent', time: '09:42 AM', status: 'Delivered' },
                  { type: 'WA', msg: 'PT1 marks notification sent to Grade 10A', time: '10:15 AM', status: 'Read' },
                  { type: 'SMS', msg: 'Absence alert — Saanvi Sharma (6A)', time: '11:00 AM', status: 'Delivered' },
                  { type: 'WA', msg: 'PTM invite bulk sent to Grade 8 parents', time: '02:30 PM', status: 'Sent' },
                ].map((m) => (
                  <div className="timeline-item" key={m.msg}>
                    <time style={{ background: m.type === 'WA' ? '#dcfce7' : '#dbeafe', color: m.type === 'WA' ? '#166534' : '#1e40af', borderRadius: '4px', padding: '2px 6px' }}>{m.type}</time>
                    <div><strong>{m.msg}</strong><span>{m.time}</span></div>
                    <em style={{ color: '#10b981' }}>{m.status}</em>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><h2>Send Bulk Message</h2><p>Target by class, grade, or role</p></div>
              </div>
              <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select className="persona-selector" style={{ width: '100%' }}>
                  <option>All Parents</option>
                  <option>Grade 10 Parents</option>
                  <option>Fee Defaulters</option>
                  <option>All Staff</option>
                </select>
                <textarea style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Type your message here..." />
                <button className="btn-action-sm" type="button" style={{ alignSelf: 'flex-end' }}>
                  <Send size={14} /> Send via SMS &amp; WhatsApp
                </button>
              </div>
            </article>
          </section>
        )}

        {activeNav === 'Reports' && (
          <section className="content-grid">
            <article className="panel" style={{ gridColumn: '1 / -1' }}>
              <div className="panel-heading">
                <div><h2>Reports &amp; Analytics</h2><p>Institutional data exports and academic summaries</p></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', padding: '8px 0' }}>
                {[
                  { label: 'Attendance Summary Report', icon: ClipboardCheck, desc: 'Grade-wise daily/monthly roll-call export', color: '#0ea5e9' },
                  { label: 'Fee Collection Report', icon: CircleDollarSign, desc: 'Receipts, aging, and concession ledger', color: '#10b981' },
                  { label: 'Student Progress Report', icon: FileBarChart, desc: 'CBSE mark sheets and PT1/PT2 results', color: '#8b5cf6' },
                  { label: 'Staff Attendance & Payroll', icon: GraduationCap, desc: 'Monthly staff attendance and disbursement', color: '#f59e0b' },
                  { label: 'TC & Admission Register', icon: Database, desc: 'Issued TCs and new admissions log', color: '#ef4444' },
                  { label: 'Exam Schedule & Timetable', icon: CalendarDays, desc: 'Scheduled exams and room allocations', color: '#64748b' },
                  { label: 'SMS / WA Outbox Report', icon: MessageSquareText, desc: 'Communication delivery statistics', color: '#06b6d4' },
                  { label: 'Database Backup Report', icon: ShieldCheck, desc: 'Snapshot logs and recovery status', color: '#0f5f59' },
                ].map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => setActivity(`Generating: ${r.label}…`)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
                      padding: '16px', borderRadius: '10px', border: '1.5px solid var(--border)',
                      background: 'var(--surface)', cursor: 'pointer', textAlign: 'left',
                      transition: 'box-shadow 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = r.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${r.color}22` }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <r.icon size={22} style={{ color: r.color }} />
                    <strong style={{ fontSize: '13px', color: 'var(--text)' }}>{r.label}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>{r.desc}</span>
                    <span style={{ fontSize: '11px', color: r.color, fontWeight: 600, marginTop: 'auto' }}>Export PDF / CSV →</span>
                  </button>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><h2>Quick Stats</h2><p>Live institutional summary</p></div>
              </div>
              <div className="timeline-list">
                {liveMetrics.map((m) => (
                  <div className="timeline-item" key={m.label}>
                    <time style={{ minWidth: '60px', textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>{m.value}</time>
                    <div><strong>{m.label}</strong><span>{m.detail}</span></div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><h2>Recent Activity</h2><p>Generated in the last 7 days</p></div>
              </div>
              <div className="timeline-list">
                {[
                  { name: 'Fee Collection — August 2026', date: '11 Sep', by: 'Accountant' },
                  { name: 'Attendance Summary — Week 36', date: '09 Sep', by: 'Principal' },
                  { name: 'PT1 Results — Grade 10A', date: '07 Sep', by: 'Teacher' },
                ].map((r) => (
                  <div className="timeline-item" key={r.name}>
                    <time>{r.date}</time>
                    <div><strong>{r.name}</strong><span>Generated by {r.by}</span></div>
                    <em><button className="tc-action-btn" type="button"><Download size={11} /> Download</button></em>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}
      </section>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map(({ label, icon: Icon }) => (
          <button
            className={activeNav === label ? 'active' : ''}
            key={label}
            onClick={() => setActiveNav(label)}
            type="button"
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {showAttendanceModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="attendance-modal">
            <div className="modal-header">
              <div>
                <h2>⚡ Rapid Attendance (&lt;20s)</h2>
                <p>Grade 10A · 8 Students · Click any card to toggle Status</p>
              </div>
              <button className="close-btn" onClick={() => setShowAttendanceModal(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="attendance-grid-fast">
              {students.map((student) => {
                const status = attendanceState[student.id] || 'Present'
                return (
                  <button
                    key={student.id}
                    className={`student-card-attendance status-${status.toLowerCase()}`}
                    onClick={() => toggleStatus(student.id)}
                    type="button"
                  >
                    <div className="card-top">
                      <strong>{student.name}</strong>
                      <span className="badge-status">{status}</span>
                    </div>
                    <small>{student.id} · Roll #{student.id.slice(-2)}</small>
                  </button>
                )
              })}
            </div>

            <div className="modal-footer">
              <span className="summary-text">
                Present: {Object.values(attendanceState).filter(s => s === 'Present').length} | 
                Absent: {Object.values(attendanceState).filter(s => s === 'Absent').length} | 
                Late: {Object.values(attendanceState).filter(s => s === 'Late').length}
              </span>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowAttendanceModal(false)} type="button">
                  Cancel
                </button>
                <button className="btn-save-attendance" onClick={submitAttendance} type="button">
                  <Check size={16} />
                  Submit Attendance & Notify Parents
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Command Palette (Ctrl + K) */}
      {showPalette && (
        <div className="modal-backdrop" onClick={() => setShowPalette(false)} role="dialog" aria-modal="true">
          <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
            <div className="palette-input-row">
              <Command size={18} className="palette-icon" />
              <input
                autoFocus
                placeholder="Type a command, student, or jump to module..."
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
                className="palette-input"
              />
              <span className="palette-esc" onClick={() => setShowPalette(false)}>ESC</span>
            </div>

            <div className="palette-results">
              <div className="palette-section-label">Quick Actions</div>
              <div 
                className="palette-item"
                onClick={() => {
                  setShowPalette(false)
                  setShowAttendanceModal(true)
                }}
              >
                <Zap size={16} />
                <span>Take Fast Attendance (Class 10A)</span>
                <span className="palette-badge">Action</span>
              </div>
              <div 
                className="palette-item"
                onClick={() => {
                  setShowPalette(false)
                  setQuery('Due')
                  setActivity('Filtered student directory to overdue fees.')
                }}
              >
                <CircleDollarSign size={16} />
                <span>Show Fee Defaulters / Invoices Due</span>
                <span className="palette-badge">Filter</span>
              </div>
              <div 
                className="palette-item"
                onClick={() => {
                  setShowPalette(false)
                  handleOpenFeeModal()
                }}
              >
                <CreditCard size={16} />
                <span>Record Fee Payment & Issue Receipt</span>
                <span className="palette-badge">Account</span>
              </div>
              <div 
                className="palette-item"
                onClick={() => {
                  setShowPalette(false)
                  handleViewReportCard('VIS-2026-0048')
                }}
              >
                <FileBarChart size={16} />
                <span>Generate Official CBSE Report Card (Aarav Mehta)</span>
                <span className="palette-badge">Exam</span>
              </div>

              <div className="palette-section-label">Switch Persona / View</div>
              {['Principal', 'Teacher', 'Parent', 'Accountant'].map((p) => (
                <div 
                  key={p}
                  className="palette-item"
                  onClick={() => {
                    setPersona(p as any)
                    setShowPalette(false)
                    setActivity(`Switched context to ${p}`)
                  }}
                >
                  <Sparkles size={16} />
                  <span>Switch Role: {p}</span>
                  <ArrowRight size={14} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Certificate (TC) Issue Modal */}
      {showTCModal && tcTargetStudent && (
        <div className="modal-backdrop" onClick={() => setShowTCModal(false)} role="dialog" aria-modal="true">
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>📜 Issue Transfer Certificate (TC)</h2>
                <p>Vidyuth International School · Official School Leaving Certificate</p>
              </div>
              <button className="close-btn" onClick={() => setShowTCModal(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="tc-body">
              <div className="tc-certificate-preview">
                <div className="tc-cert-header">
                  <h3>VIDYUTH INTERNATIONAL SCHOOL</h3>
                  <small>Affiliated to CBSE, New Delhi · Affiliation No. 3630124</small>
                  <p>Hyderabad, Telangana | UDISE+ Code: 36190500124</p>
                  <div className="tc-badge-title">TRANSFER CERTIFICATE</div>
                </div>

                <div className="tc-fields-grid">
                  <div><strong>TC Serial No:</strong> VIS/TC/2026/0142</div>
                  <div><strong>Admission No:</strong> {tcTargetStudent.id}</div>
                  <div><strong>Student Name:</strong> {tcTargetStudent.name}</div>
                  <div><strong>Class Last Studied:</strong> {tcTargetStudent.grade}</div>
                  <div><strong>National PEN:</strong> 36190500123</div>
                  <div><strong>APAAR ID:</strong> 4591-2849-1029</div>
                  <div><strong>General Conduct:</strong> Good</div>
                  <div>
                    <strong>Fee Clearance Status:</strong>{' '}
                    <span className={tcTargetStudent.balance === '₹0' ? 'text-green' : 'text-red'}>
                      {tcTargetStudent.balance === '₹0' ? 'All Dues Cleared (Verified)' : `Pending Dues: ${tcTargetStudent.balance}`}
                    </span>
                  </div>
                </div>

                {tcTargetStudent.balance !== '₹0' && (
                  <div className="tc-warning-box">
                    ⚠️ <strong>Fee Clearance Guard:</strong> This student has outstanding dues ({tcTargetStudent.balance}). 
                    Under school regulations, official TC issuance cannot be completed until dues are settled.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowTCModal(false)} type="button">
                Cancel
              </button>
              <button 
                className="btn-save-attendance"
                disabled={tcTargetStudent.balance !== '₹0'}
                onClick={() => {
                  setShowTCModal(false)
                  setActivity(`Transfer Certificate VIS/TC/2026/0142 issued for ${tcTargetStudent.name}. Logged in register.`)
                }}
                type="button"
                style={{ opacity: tcTargetStudent.balance !== '₹0' ? 0.5 : 1, cursor: tcTargetStudent.balance !== '₹0' ? 'not-allowed' : 'pointer' }}
              >
                <Printer size={16} />
                Generate & Issue Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="settings-modal-dialog">
            <div className="settings-modal-header">
              <div>
                <h2>⚙️ School OS Onboarding & Settings Center</h2>
                <p>Self-service configuration for school leadership · Zero developer touch required</p>
              </div>
              <button className="close-btn" onClick={() => setShowSettingsModal(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="settings-nav-tabs">
              <button
                className={`settings-tab-btn ${settingsTab === 'profile' ? 'active' : ''}`}
                onClick={() => setSettingsTab('profile')}
                type="button"
              >
                <ShieldCheck size={15} />
                <span>School Profile</span>
              </button>
              <button
                className={`settings-tab-btn ${settingsTab === 'gateways' ? 'active' : ''}`}
                onClick={() => setSettingsTab('gateways')}
                type="button"
              >
                <Key size={15} />
                <span>Payment & SMS Gateways</span>
              </button>
              <button
                className={`settings-tab-btn ${settingsTab === 'examination' ? 'active' : ''}`}
                onClick={() => setSettingsTab('examination')}
                type="button"
              >
                <Sliders size={15} />
                <span>Examination & Grading</span>
              </button>
              <button
                className={`settings-tab-btn ${settingsTab === 'importer' ? 'active' : ''}`}
                onClick={() => setSettingsTab('importer')}
                type="button"
              >
                <FileSpreadsheet size={15} />
                <span>Bulk CSV Importer</span>
              </button>
              <button
                className={`settings-tab-btn ${settingsTab === 'backups' ? 'active' : ''}`}
                onClick={() => {
                  setSettingsTab('backups')
                  fetch(`${API_BASE}/api/v1/backup/list`, { headers: authHeaders() })
                    .then((r) => r.json())
                    .then((d) => { if (d.snapshots) setBackupSnapshots(d.snapshots) })
                }}
                type="button"
              >
                <Database size={15} />
                <span>Backup & Recovery</span>
              </button>
            </div>

            <div className="settings-tab-body">
              {settingsTab === 'profile' && (
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>School Name</label>
                    <input
                      value={schoolProfile.name}
                      onChange={(e) => setSchoolProfile({ ...schoolProfile, name: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Education Board</label>
                    <select
                      value={schoolProfile.board}
                      onChange={(e) => setSchoolProfile({ ...schoolProfile, board: e.target.value })}
                    >
                      <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                      <option value="ICSE">CISCE / ICSE</option>
                      <option value="Telangana State Board">Telangana State Board (SSC)</option>
                      <option value="Maharashtra State Board">Maharashtra State Board (SSC)</option>
                      <option value="Karnataka State Board">Karnataka State Board</option>
                      <option value="IB">International Baccalaureate (IB)</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Affiliation Number</label>
                    <input
                      value={schoolProfile.affiliation_no}
                      onChange={(e) => setSchoolProfile({ ...schoolProfile, affiliation_no: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>UDISE+ National School Code</label>
                    <input
                      value={schoolProfile.udise_code}
                      onChange={(e) => setSchoolProfile({ ...schoolProfile, udise_code: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Principal / Head of School</label>
                    <input
                      value={schoolProfile.principal_name}
                      onChange={(e) => setSchoolProfile({ ...schoolProfile, principal_name: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Academic Year</label>
                    <input
                      value={schoolProfile.academic_year}
                      onChange={(e) => setSchoolProfile({ ...schoolProfile, academic_year: e.target.value })}
                    />
                  </div>
                  <div className="form-field" style={{ gridColumn: 'span 2' }}>
                    <label>Official School Address</label>
                    <textarea
                      rows={2}
                      value={schoolProfile.address}
                      onChange={(e) => setSchoolProfile({ ...schoolProfile, address: e.target.value })}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button className="btn-primary" onClick={handleSaveProfile} type="button">
                      Save School Profile
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'gateways' && (
                <div>
                  <div className="integration-box">
                    <div className="integration-box-title">
                      <CreditCard size={17} color="#0f5f59" />
                      <span>Online Fee Payment Gateway (Direct to School Bank)</span>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label>Razorpay Key ID</label>
                        <input
                          placeholder="rzp_live_..."
                          value={systemSettings.razorpay_key_id?.value || ''}
                          onChange={(e) => setSystemSettings({ ...systemSettings, razorpay_key_id: { value: e.target.value } })}
                        />
                        <small>Payments deposit directly into your designated bank account</small>
                      </div>
                      <div className="form-field">
                        <label>Razorpay Key Secret</label>
                        <input
                          type="password"
                          placeholder="••••••••••••••••"
                          value={systemSettings.razorpay_key_secret?.value || ''}
                          onChange={(e) => setSystemSettings({ ...systemSettings, razorpay_key_secret: { value: e.target.value } })}
                        />
                        <small>Never shared with anyone; securely saved in local SQLite</small>
                      </div>
                      <div className="form-field" style={{ gridColumn: 'span 2' }}>
                        <label>School Official UPI VPA / QR Handle</label>
                        <input
                          value={systemSettings.school_upi_id?.value || ''}
                          onChange={(e) => setSystemSettings({ ...systemSettings, school_upi_id: { value: e.target.value } })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="integration-box">
                    <div className="integration-box-title">
                      <Send size={17} color="#0f5f59" />
                      <span>SMS & WhatsApp Communication Outbox</span>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label>SMS Gateway Provider</label>
                        <select
                          value={systemSettings.sms_provider?.value || 'Fast2SMS'}
                          onChange={(e) => setSystemSettings({ ...systemSettings, sms_provider: { value: e.target.value } })}
                        >
                          <option value="Fast2SMS">Fast2SMS (Indian DLT Pre-configured)</option>
                          <option value="Gupshup">Gupshup Enterprise</option>
                          <option value="Twilio">Twilio</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label>DLT Registered Sender ID (6 Chars)</label>
                        <input
                          value={systemSettings.sms_sender_id?.value || ''}
                          onChange={(e) => setSystemSettings({ ...systemSettings, sms_sender_id: { value: e.target.value } })}
                        />
                      </div>
                      <div className="form-field" style={{ gridColumn: 'span 2' }}>
                        <label>SMS API Key</label>
                        <input
                          type="password"
                          placeholder="Enter your Fast2SMS or Gupshup API Key"
                          value={systemSettings.sms_api_key?.value || ''}
                          onChange={(e) => setSystemSettings({ ...systemSettings, sms_api_key: { value: e.target.value } })}
                        />
                      </div>
                      <div className="form-field" style={{ gridColumn: 'span 2' }}>
                        <label>WhatsApp Cloud API Access Token</label>
                        <input
                          type="password"
                          placeholder="EAAB..."
                          value={systemSettings.whatsapp_cloud_token?.value || ''}
                          onChange={(e) => setSystemSettings({ ...systemSettings, whatsapp_cloud_token: { value: e.target.value } })}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button className="btn-primary" onClick={handleSaveSettings} type="button">
                      Save Gateway Credentials
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'examination' && (
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Passing Threshold Percentage (%)</label>
                    <input
                      type="number"
                      value={systemSettings.passing_threshold_pct?.value || '33'}
                      onChange={(e) => setSystemSettings({ ...systemSettings, passing_threshold_pct: { value: e.target.value } })}
                    />
                    <small>CBSE standard is 33%; Telangana SSC is 35%</small>
                  </div>
                  <div className="form-field">
                    <label>Evaluation & Grading Scale</label>
                    <select
                      value={systemSettings.grading_scale?.value || 'CBSE_9_POINT'}
                      onChange={(e) => setSystemSettings({ ...systemSettings, grading_scale: { value: e.target.value } })}
                    >
                      <option value="CBSE_9_POINT">CBSE 9-Point Scale (A1 to E2)</option>
                      <option value="STATE_BOARD_GPA">State Board GPA Scale (A1 to E)</option>
                      <option value="CO_SCHOLASTIC_3_POINT">Co-Scholastic 3-Point Scale (A, B, C)</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Maximum Grace Marks Allowed</label>
                    <input
                      type="number"
                      value={systemSettings.grace_marks_max?.value || '5'}
                      onChange={(e) => setSystemSettings({ ...systemSettings, grace_marks_max: { value: e.target.value } })}
                    />
                    <small>Automatically simulated for borderline students</small>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                    <button className="btn-primary" onClick={handleSaveSettings} type="button">
                      Save Examination Rules
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'importer' && (
                <div className="importer-container">
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                    Paste your student roster in CSV format. The built-in Government Readiness validator checks 11-digit UDISE PEN, 12-digit APAAR, and admission numbers before committing to SQLite.
                  </p>
                  <textarea
                    className="csv-textarea"
                    value={importerText}
                    onChange={(e) => setImporterText(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => handleValidateCSV(false)} type="button">
                      Pre-flight Validate Roster
                    </button>
                    <button className="btn-primary" onClick={() => handleValidateCSV(true)} type="button">
                      Commit Import to School Database
                    </button>
                  </div>

                  {importResults && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ padding: '8px 12px', background: importResults.error_count > 0 ? '#fff1f2' : '#f0fdf4', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }}>
                        <strong>Validation Summary:</strong> {importResults.valid_count} Valid · {importResults.error_count} Errors {importResults.committed ? '· (COMMITTED TO DATABASE)' : ''}
                      </div>
                      <table className="validation-table">
                        <thead>
                          <tr>
                            <th>Row</th>
                            <th>Admission No</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Validation Findings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResults.results.map((r: any) => (
                            <tr key={r.row}>
                              <td>{r.row}</td>
                              <td>{r.admission_number}</td>
                              <td>{r.name}</td>
                              <td>
                                <span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span>
                              </td>
                              <td style={{ color: r.errors.length ? '#dc2626' : '#16a34a' }}>
                                {r.errors.length ? r.errors.join(', ') : 'All format checks passed'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {settingsTab === 'backups' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>Disaster Recovery & Local Database Snapshots</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        Download the entire SQLite database file or create instant encrypted point-in-time snapshots.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary" onClick={() => window.open(`${API_BASE}/api/v1/backup/download`)} type="button">
                        <Download size={15} />
                        Download Full Database (.db)
                      </button>
                      <button className="btn-primary" onClick={handleCreateSnapshot} type="button">
                        <Database size={15} />
                        Create Snapshot Now
                      </button>
                    </div>
                  </div>

                  <table className="backup-table">
                    <thead>
                      <tr>
                        <th>Snapshot File</th>
                        <th>File Size</th>
                        <th>Created Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backupSnapshots.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                            No point-in-time snapshots created yet. Click 'Create Snapshot Now' above.
                          </td>
                        </tr>
                      ) : (
                        backupSnapshots.map((s: any) => (
                          <tr key={s.filename}>
                            <td><strong>{s.filename}</strong></td>
                            <td>{(s.size_bytes / 1024).toFixed(1)} KB</td>
                            <td>{new Date(s.created_at).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Fee Collection & Stamped Receipt Modal */}
      {showFeeModal && (
        <div className="modal-backdrop" onClick={() => { setShowFeeModal(false); setFeeReceiptData(null); }} role="dialog" aria-modal="true">
          <div className="receipt-modal-dialog" onClick={(e) => e.stopPropagation()}>
            {!feeReceiptData ? (
              <div>
                <div className="modal-header">
                  <div>
                    <h2>💳 Fee Collection & Stamped Receipt</h2>
                    <p>Record tuition & transport collections · Immediate bank reconciliation</p>
                  </div>
                  <button className="close-btn" onClick={() => setShowFeeModal(false)} type="button">
                    <X size={18} />
                  </button>
                </div>
                <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-field">
                    <label>Select Student</label>
                    <select
                      value={feeTargetStudent?.id || ''}
                      onChange={(e) => {
                        const st = liveStudents.find((s) => s.id === e.target.value)
                        setFeeTargetStudent(st || liveStudents[0])
                        if (st) setFeeAmount(st.balance.replace(/[^\d]/g, '') || '5000')
                      }}
                    >
                      {liveStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.id} - {s.grade}) — Balance: {s.balance}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-field">
                      <label>Collection Amount (₹)</label>
                      <input
                        type="number"
                        value={feeAmount}
                        onChange={(e) => setFeeAmount(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Payment Mode</label>
                      <select value={feePaymentMode} onChange={(e) => setFeePaymentMode(e.target.value)}>
                        <option value="UPI / Online">UPI / QR Code</option>
                        <option value="Razorpay">Razorpay Gateway</option>
                        <option value="NetBanking/NEFT">Net Banking / NEFT</option>
                        <option value="Cheque/DD">Cheque / Demand Draft</option>
                        <option value="Cash">Cash at Counter</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: '14px 0 0 0' }}>
                  <button className="btn-cancel" onClick={() => setShowFeeModal(false)} type="button">
                    Cancel
                  </button>
                  <button className="btn-primary" id="btn-confirm-fee-collect" onClick={handleCollectFee} type="button">
                    <Check size={16} />
                    Confirm Payment & Generate Stamped Receipt
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="receipt-sheet">
                  <div className="receipt-stamp-paid">PAID</div>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, color: '#0f5f59', fontSize: '18px' }}>{schoolProfile.name}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                      UDISE+ {schoolProfile.udise_code} · Affiliation No: {schoolProfile.affiliation_no}
                    </p>
                    <div style={{ display: 'inline-block', background: '#0f5f59', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 10px', borderRadius: '4px', marginTop: '6px' }}>
                      FEE COLLECTION RECEIPT
                    </div>
                  </div>

                  <div className="receipt-row">
                    <span>Receipt Number:</span>
                    <strong>{feeReceiptData.receipt_number}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Date & Time:</span>
                    <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Student Name:</span>
                    <strong>{feeReceiptData.student_name}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Admission Number:</span>
                    <strong>{feeReceiptData.admission_number}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Payment Mode:</span>
                    <strong>{feeReceiptData.payment_mode}</strong>
                  </div>
                  <div className="receipt-row" style={{ fontSize: '15px', background: '#f8fafc', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                    <span>Total Amount Paid:</span>
                    <strong style={{ color: '#0f5f59', fontSize: '16px' }}>₹{Number(feeReceiptData.amount_paid).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Remaining Balance:</span>
                    <strong style={{ color: feeReceiptData.remaining_balance > 0 ? '#ef4444' : '#16a34a' }}>
                      ₹{Number(feeReceiptData.remaining_balance).toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', fontSize: '11px', color: '#64748b' }}>
                    <div>Authorized Signatory (Cashier)</div>
                    <div>Computer Generated Stamped Copy</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button className="btn-secondary" onClick={() => { setShowFeeModal(false); setFeeReceiptData(null); }} type="button">
                    Close
                  </button>
                  <button className="btn-primary" onClick={() => window.print()} type="button">
                    <Printer size={15} />
                    Print Receipt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official CBSE Report Card Modal */}
      {showReportCardModal && reportCardData && (
        <div className="modal-backdrop" onClick={() => setShowReportCardModal(false)} role="dialog" aria-modal="true">
          <div className="report-card-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="report-card-sheet">
              <div className="report-card-header">
                <h2>{reportCardData.school_name || schoolProfile.name}</h2>
                <p>
                  Affiliated to CBSE, New Delhi · Affiliation No. {reportCardData.affiliation_no || schoolProfile.affiliation_no} | UDISE+ {reportCardData.udise_code || schoolProfile.udise_code}
                </p>
                <div className="report-card-title-pill">OFFICIAL REPORT CARD — {reportCardData.examination}</div>
              </div>

              <div className="report-card-student-meta">
                <div><strong>Student Name:</strong> {reportCardData.student_name}</div>
                <div><strong>Admission No:</strong> {reportCardData.admission_number}</div>
                <div><strong>Class & Section:</strong> {reportCardData.class} - {reportCardData.section}</div>
                <div><strong>Academic Year:</strong> {reportCardData.academic_year}</div>
                <div><strong>National PEN:</strong> {reportCardData.pen_number || '36190500123'}</div>
                <div><strong>APAAR / Edu ID:</strong> {reportCardData.apaar_id || '4591-2849-1029'}</div>
                <div><strong>Attendance Rate:</strong> {reportCardData.attendance_pct}</div>
                <div>
                  <strong>CBSE 75% Rule:</strong>{' '}
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ COMPLIANT ({reportCardData.attendance_compliance})</span>
                </div>
              </div>

              <h4 style={{ margin: '14px 0 8px', color: '#0f5f59', fontSize: '14px' }}>PART 1: SCHOLASTIC AREAS</h4>
              <table className="report-card-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Max Marks</th>
                    <th>Marks Obtained</th>
                    <th>Grade</th>
                    <th>Grade Point</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCardData.scholastic_subjects.map((sub: any) => (
                    <tr key={sub.subject}>
                      <td><strong>{sub.subject}</strong></td>
                      <td>{sub.max_marks}</td>
                      <td><strong>{sub.obtained}</strong></td>
                      <td><span className="badge-status" style={{ color: '#0f5f59' }}>{sub.grade}</span></td>
                      <td>{sub.point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 style={{ margin: '14px 0 8px', color: '#0f5f59', fontSize: '14px' }}>PART 2: CO-SCHOLASTIC ACTIVITIES (3-POINT SCALE A-C)</h4>
              <table className="report-card-table">
                <thead>
                  <tr>
                    <th>Co-Scholastic Area</th>
                    <th>Grade</th>
                    <th>Descriptive Indicator</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCardData.co_scholastic.map((co: any) => (
                    <tr key={co.area}>
                      <td><strong>{co.area}</strong></td>
                      <td><span className="badge-status" style={{ color: '#16a34a' }}>{co.grade}</span></td>
                      <td>{co.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="report-card-result-bar">
                <div>
                  <strong>Aggregate Percentage:</strong> {reportCardData.aggregate_percentage}%
                </div>
                <div>
                  <strong>Overall Grade:</strong> <span style={{ color: '#0f5f59', fontWeight: 800 }}>{reportCardData.overall_grade}</span>
                </div>
                <div>
                  <strong>Result Status:</strong> <span style={{ color: '#16a34a', fontWeight: 800 }}>{reportCardData.result}</span>
                </div>
              </div>

              <div className="report-card-signatures">
                <div>
                  <p style={{ margin: '0 0 30px' }}>Class Teacher</p>
                  <strong>Ms. Ananya Roy</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 30px' }}>Examination Controller</p>
                  <strong>Verified & Stamped</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 30px' }}>Principal</p>
                  <strong>{schoolProfile.principal_name}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowReportCardModal(false)} type="button">
                Close
              </button>
              <button className="btn-primary" onClick={() => window.print()} type="button">
                <Printer size={15} />
                Print CBSE Mark Sheet
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Teacher Rapid Mark Entry Modal */}
      {showMarksModal && (
        <div className="modal-backdrop" onClick={() => setShowMarksModal(false)} role="dialog" aria-modal="true">
          <div className="marks-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>📝 Grade Periodic Test 1 (PT1) — Mathematics</h2>
                <p>Grade 10A · {marksRoster.length} Students · Auto-calculates CBSE 9-Point Grade</p>
              </div>
              <button className="close-btn" onClick={() => setShowMarksModal(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="marks-body">
              <div className="marks-meta-strip">
                <span>Class: Grade 10 - Section A</span>
                <span>Subject: Mathematics (Code 041)</span>
                <span>Max Marks: 100</span>
                <span>Pass Rule: CBSE 33%</span>
              </div>

              <table className="marks-table">
                <thead>
                  <tr>
                    <th>Roll #</th>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    <th>Max Marks</th>
                    <th>Marks Obtained</th>
                    <th>CBSE Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {marksRoster.map((m) => (
                    <tr key={m.admission_number}>
                      <td><strong>{m.roll_number || m.admission_number?.slice(-2)}</strong></td>
                      <td>{m.admission_number}</td>
                      <td><strong>{m.student_name}</strong></td>
                      <td>{m.max_marks || 100}</td>
                      <td>
                        <input
                          className="mark-input"
                          type="number"
                          min="0"
                          max="100"
                          value={m.marks_obtained}
                          onChange={(e) => handleUpdateMark(m.admission_number, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <span className={`badge-status ${m.grade === 'A1' || m.grade === 'A2' ? 'pill-green' : m.grade === 'E' ? 'status-absent' : 'pill-yellow'}`}>
                          {m.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <span className="summary-text">
                Graded: {marksRoster.filter((m) => m.marks_obtained > 0).length} of {marksRoster.length} students
              </span>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowMarksModal(false)} type="button">
                  Cancel
                </button>
                <button className="btn-primary" id="btn-save-marks-db" onClick={handleSaveMarks} type="button">
                  <Check size={16} />
                  Save Marks to School Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication & User Switching Modal */}
      {showLockModal && (
        <div className="modal-backdrop" onClick={() => setShowLockModal(false)} role="dialog" aria-modal="true">
          <div className="lock-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '10px', background: '#e7f3f2', borderRadius: '50%', color: '#0f5f59', marginBottom: '8px' }}>
                <Key size={24} />
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f5f59' }}>School OS Security & Role Gate</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Session authentication backed by local SQLite password verification
              </p>
            </div>

            <div className="role-chips-grid">
              {[
                { role: 'Principal', uname: 'admin', label: '👑 Principal (Admin)' },
                { role: 'Teacher', uname: 'teacher', label: '👩‍🏫 Lead Teacher' },
                { role: 'Accountant', uname: 'accountant', label: '💳 Accounts Cashier' },
                { role: 'Parent', uname: 'parent', label: '👨‍👩‍👧 Parent Portal' }
              ].map((item) => (
                <button
                  key={item.role}
                  className={`role-chip ${persona === item.role ? 'active' : ''}`}
                  onClick={() => handleQuickLogin(item.role as any)}
                  type="button"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-field">
                <label>Username</label>
                <input value={lockUsername} onChange={(e) => setLockUsername(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Password</label>
                <input type="password" value={lockPassword} onChange={(e) => setLockPassword(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-cancel" onClick={() => setShowLockModal(false)} type="button">
                Close
              </button>
              <button
                className="btn-primary"
                id="btn-unlock-workspace"
                onClick={() => handleQuickLogin(persona, lockUsername)}
                type="button"
              >
                <ShieldCheck size={16} />
                Authenticate & Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </main>

  )
}

export default App

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { UserPlus, Mail, Building2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { usersApi, authApi, departmentsApi } from '@/services/api'
import { mockUsers, mockDepartments, delay } from '@/services/mockData'
import { getInitials } from '@/lib/utils'
import type { User, Department } from '@/types'
import { useAuth } from '@/context/AuthContext'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

interface EmployeeForm {
  email: string
  password: string
  firstName: string
  lastName: string
  departmentId: string
  jobTitle: string
  phone: string
}

export function EmployeesPage() {
  const { isAdmin } = useAuth()
  const [employees, setEmployees] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeError, setNoticeError] = useState(false)

  const { register, handleSubmit, reset } = useForm<EmployeeForm>()

  const load = async () => {
    setLoading(true)
    try {
      if (USE_MOCK) {
        setEmployees(await delay([...mockUsers]))
        setDepartments(await delay([...mockDepartments]))
      } else {
        const [usersRes, deptRes] = await Promise.all([usersApi.getAll(), departmentsApi.getAll()])
        setEmployees(usersRes.data)
        setDepartments(deptRes.data)
      }
    } catch {
      setEmployees(mockUsers)
      setDepartments(mockDepartments)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (data: EmployeeForm) => {
    const payload = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      departmentId: data.departmentId ? Number(data.departmentId) : undefined,
      jobTitle: data.jobTitle || undefined,
      phone: data.phone || undefined,
    }

    setNotice('')
    setNoticeError(false)
    try {
      if (USE_MOCK) {
        const dept = departments.find((d) => d.id === payload.departmentId)
        setEmployees((prev) => [...prev, {
          id: Date.now(),
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          fullName: `${payload.firstName} ${payload.lastName}`,
          role: 'Employee',
          departmentId: payload.departmentId,
          departmentName: dept?.name,
          jobTitle: payload.jobTitle,
          phone: payload.phone,
        }])
        setNoticeError(true)
        setNotice('Demo mode cannot email login details. Start the API so the new employee receives their credentials.')
      } else {
        const res = await authApi.register(payload)
        await load()
        setNoticeError(res.data.welcomeEmailSent === false)
        setNotice(res.data.welcomeEmailMessage || 'Employee account created.')
      }
      setShowForm(false)
      reset()
    } catch {
      setNoticeError(true)
      setNotice('Could not create the employee account. Check that the email is not already registered.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this employee?')) return
    if (USE_MOCK) {
      setEmployees((prev) => prev.filter((e) => e.id !== id))
    } else {
      await usersApi.delete(id)
      await load()
    }
  }

  if (!isAdmin) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Only administrators can manage employees.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground text-sm">Manage company staff and accounts</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <UserPlus className="h-4 w-4" />Add Employee
        </Button>
      </div>

      {notice && (
        <div className={`rounded-md px-3 py-2 text-sm ${noticeError ? 'bg-destructive/10 text-destructive' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
          {notice}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Register New Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input {...register('firstName', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input {...register('lastName', { required: true })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Email</Label>
                <Input type="email" {...register('email', { required: true })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Temporary Password</Label>
                <Input type="password" {...register('password', { required: true, minLength: 6 })} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select {...register('departmentId')}>
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input {...register('jobTitle')} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Phone</Label>
                <Input {...register('phone')} placeholder="+975 17123456" />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">Create Account</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <Card key={emp.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {getInitials(emp.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{emp.fullName}</p>
                      <Badge variant={emp.role === 'Administrator' ? 'default' : 'secondary'} className="flex-shrink-0">
                        {emp.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />{emp.email}
                    </p>
                    {emp.departmentName && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />{emp.departmentName}
                      </p>
                    )}
                    {emp.jobTitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">{emp.jobTitle}</p>
                    )}
                  </div>
                  {emp.role !== 'Administrator' && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

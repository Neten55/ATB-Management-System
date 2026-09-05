import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { User, Mail, Phone, Building2, Briefcase, LogOut, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/context/AuthContext'
import { mockDepartments } from '@/services/mockData'
import { departmentsApi, usersApi } from '@/services/api'
import type { Department, User as UserType } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

interface ProfileForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string
  departmentId: string
  newPassword: string
  confirmPassword: string
}

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [notice, setNotice] = useState('')
  const [noticeError, setNoticeError] = useState(false)

  const { register, handleSubmit } = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      jobTitle: user?.jobTitle || '',
      departmentId: user?.departmentId ? String(user.departmentId) : '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (USE_MOCK) return
    departmentsApi.getAll()
      .then((res) => setDepartments(res.data))
      .catch(() => setDepartments(mockDepartments))
  }, [])

  if (!user) return null

  const onSubmit = async (data: ProfileForm) => {
    setNotice('')
    setNoticeError(false)

    if (data.newPassword || data.confirmPassword) {
      if (data.newPassword.length < 6) {
        setNoticeError(true)
        setNotice('New password must be at least 6 characters.')
        return
      }
      if (data.newPassword !== data.confirmPassword) {
        setNoticeError(true)
        setNotice('New password and confirmation do not match.')
        return
      }
    }

    const dept = departments.find((d) => String(d.id) === data.departmentId)
    const updated: UserType = {
      ...user,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      departmentId: data.departmentId ? Number(data.departmentId) : undefined,
      departmentName: dept?.name,
      fullName: `${data.firstName} ${data.lastName}`,
    }

    try {
      if (USE_MOCK) {
        updateUser(updated)
        setNotice('Profile saved locally in demo mode.')
      } else {
        const res = await usersApi.update(user.id, {
          ...updated,
          newPassword: data.newPassword || undefined,
        })
        updateUser(res.data)
        setNotice(data.newPassword ? 'Profile and password saved.' : 'Profile saved.')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setNoticeError(true)
      setNotice(axiosErr.response?.data?.message || 'Could not save profile.')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit profile</h1>
        <p className="text-muted-foreground text-sm">Update your account details, department, and password</p>
      </div>

      {notice && (
        <div className={`rounded-md px-3 py-2 text-sm ${noticeError ? 'bg-destructive/10 text-destructive' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
          {notice}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <CardTitle>{user.fullName}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === 'Administrator' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
                {user.departmentName && (
                  <span className="text-xs">{user.departmentName}</span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register('firstName', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register('lastName', { required: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <Input id="email" type="email" {...register('email', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> Phone
              </Label>
              <Input id="phone" {...register('phone')} placeholder="+975 17123456" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5" /> Job Title
              </Label>
              <Input id="jobTitle" {...register('jobTitle')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId" className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" /> Department
              </Label>
              <Select id="departmentId" {...register('departmentId')}>
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              <p className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" /> Change password
              </p>
              <p className="text-xs text-muted-foreground">Leave blank to keep your current password.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input id="newPassword" type="password" {...register('newPassword')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit">
                <User className="h-4 w-4" /> Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

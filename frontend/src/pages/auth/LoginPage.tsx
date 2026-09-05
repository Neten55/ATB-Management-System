import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { mockCredentials, delay } from '@/services/mockData'
import { AerotechLogo } from '@/components/brand/AerotechLogo'
import { SidebarMountains, WaveFooter } from '@/components/brand/BrandArt'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export function LoginPage() {
  const { login, isAuthenticated, updateUser } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  if (isAuthenticated) return <Navigate to="/calendar" replace />

  const onSubmit = async (data: LoginForm) => {
    setError('')
    setLoading(true)
    try {
      if (USE_MOCK) {
        const cred = mockCredentials[data.email as keyof typeof mockCredentials]
        if (!cred || cred.password !== data.password) {
          throw new Error('Invalid email or password')
        }
        localStorage.setItem('token', 'mock-jwt-token')
        updateUser(cred.user)
        await delay(null)
        return
      }
      await login(data.email, data.password)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
      if (!USE_MOCK && err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } }
        setError(axiosErr.response?.data?.message || message)
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b2348] p-4">
      <SidebarMountains className="h-72 opacity-80" />
      <Card className="relative z-10 w-full max-w-md border-slate-200 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex justify-center">
            <AerotechLogo className="h-14" />
          </div>
          <div>
            <CardTitle className="text-2xl text-slate-900">Company Calendar</CardTitle>
            <CardDescription className="mt-1">Staff portal for Aerotech Bhutan</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@aerotech.bt"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
            </Button>
          </form>
          {USE_MOCK && (
            <div className="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Demo Accounts</p>
              <p>Admin: admin@aerotech.bt / Admin@123</p>
              <p>Employee: employee@aerotech.bt / Employee@123</p>
            </div>
          )}
          <div className="mt-4">
            <WaveFooter />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

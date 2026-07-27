import { httpClient } from '@/api/http'
import type {
  AuthMeResponse,
  AuthResponse,
  LoginPayload,
  LogoutResponse,
  RegisterCustomerPayload,
  RegisterShopOwnerPayload,
  SendOtpResponse,
  VerifyOtpResponse,
} from '@/types/auth'

export async function login(payload: LoginPayload) {
  const { data } = await httpClient.post<AuthResponse>('/auth/login', payload)

  return data
}

export async function registerCustomer(payload: RegisterCustomerPayload) {
  const { data } = await httpClient.post<AuthResponse>(
    '/auth/register/customer',
    payload,
  )

  return data
}

export async function registerShopOwner(payload: RegisterShopOwnerPayload) {
  const { data } = await httpClient.post<AuthResponse>(
    '/auth/register/shop-owner',
    payload,
  )

  return data
}

export async function refreshSession() {
  const { data } = await httpClient.post<AuthResponse>('/auth/refresh')

  return data
}

export async function fetchMe() {
  const { data } = await httpClient.get<AuthMeResponse>('/auth/me')

  return data
}

export async function logout() {
  const { data } = await httpClient.post<LogoutResponse>('/auth/logout')

  return data
}

export async function sendEmailOtp() {
  const { data } = await httpClient.post<SendOtpResponse>('/auth/otp/send')

  return data
}

export async function verifyEmailOtp(code: string) {
  const { data } = await httpClient.post<VerifyOtpResponse>('/auth/otp/verify', {
    code,
  })

  return data
}

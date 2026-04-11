import { httpClient } from '@/api/http'
import type {
  AddressFormValues,
  AddressListResponse,
  AddressResponse,
  CustomerOrdersResponse,
  CustomerProfileResponse,
  CustomerProfileUpdatePayload,
} from '@/types/customer'

export async function getCustomerProfile() {
  const { data } = await httpClient.get<CustomerProfileResponse>('/customer/profile')

  return data
}

export async function updateCustomerProfile(payload: CustomerProfileUpdatePayload) {
  const { data } = await httpClient.patch<CustomerProfileResponse>(
    '/customer/profile',
    payload,
  )

  return data
}

export async function getCustomerAddresses() {
  const { data } = await httpClient.get<AddressListResponse>('/customer/addresses')

  return data
}

export async function createCustomerAddress(payload: AddressFormValues) {
  const { data } = await httpClient.post<AddressResponse>(
    '/customer/addresses',
    payload,
  )

  return data
}

export async function updateCustomerAddress(
  addressId: string,
  payload: Partial<AddressFormValues>,
) {
  const { data } = await httpClient.patch<AddressResponse>(
    `/customer/addresses/${addressId}`,
    payload,
  )

  return data
}

export async function deleteCustomerAddress(addressId: string) {
  const { data } = await httpClient.delete<{ success: boolean }>(
    `/customer/addresses/${addressId}`,
  )

  return data
}

export async function getCustomerOrders() {
  const { data } = await httpClient.get<CustomerOrdersResponse>('/customer/orders')

  return data
}

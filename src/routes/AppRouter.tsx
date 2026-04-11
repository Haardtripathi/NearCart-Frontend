import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthBootstrap } from '@/routes/AuthBootstrap'
import { GuestRoute } from '@/routes/GuestRoute'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RoleRoute } from '@/routes/RoleRoute'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { MainLayout } from '@/layouts/MainLayout'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OrderDetailsPage } from '@/pages/OrderDetailsPage'
import { OrderSuccessPage } from '@/pages/OrderSuccessPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { ShopDetailsPage } from '@/pages/ShopDetailsPage'
import { ShopsPage } from '@/pages/ShopsPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterCustomerPage } from '@/pages/auth/RegisterCustomerPage'
import { RegisterShopOwnerPage } from '@/pages/auth/RegisterShopOwnerPage'
import { DashboardIndexPage } from '@/pages/dashboard/DashboardIndexPage'
import { AdminApprovalsPage } from '@/pages/dashboard/admin/AdminApprovalsPage'
import { AdminDashboardPage } from '@/pages/dashboard/admin/AdminDashboardPage'
import { AdminOrdersPage } from '@/pages/dashboard/admin/AdminOrdersPage'
import { AdminShopsPage } from '@/pages/dashboard/admin/AdminShopsPage'
import { AdminUsersPage } from '@/pages/dashboard/admin/AdminUsersPage'
import { CustomerAddressesPage } from '@/pages/dashboard/customer/CustomerAddressesPage'
import { CustomerDashboardPage } from '@/pages/dashboard/customer/CustomerDashboardPage'
import { CustomerOrdersPage } from '@/pages/dashboard/customer/CustomerOrdersPage'
import { CustomerProfilePage } from '@/pages/dashboard/customer/CustomerProfilePage'
import { ShopOwnerDashboardPage } from '@/pages/dashboard/shop-owner/ShopOwnerDashboardPage'
import { ShopOwnerProfilePage } from '@/pages/dashboard/shop-owner/ShopOwnerProfilePage'
import { ShopOwnerShopFormPage } from '@/pages/dashboard/shop-owner/ShopOwnerShopFormPage'
import { ShopOwnerShopsPage } from '@/pages/dashboard/shop-owner/ShopOwnerShopsPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shops" element={<ShopsPage />} />
          <Route path="shops/:shopId" element={<ShopDetailsPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailsPage />} />
          <Route element={<GuestRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register/customer" element={<RegisterCustomerPage />} />
            <Route path="register/shop-owner" element={<RegisterShopOwnerPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />} path="dashboard">
            <Route index element={<DashboardIndexPage />} />

            <Route element={<RoleRoute allowedRoles={['CUSTOMER']} />}>
              <Route path="customer" element={<CustomerDashboardPage />} />
              <Route path="customer/profile" element={<CustomerProfilePage />} />
              <Route path="customer/addresses" element={<CustomerAddressesPage />} />
              <Route path="customer/orders" element={<CustomerOrdersPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['SHOP_OWNER']} />}>
              <Route path="shop-owner" element={<ShopOwnerDashboardPage />} />
              <Route path="shop-owner/profile" element={<ShopOwnerProfilePage />} />
              <Route path="shop-owner/shops" element={<ShopOwnerShopsPage />} />
              <Route path="shop-owner/shops/new" element={<ShopOwnerShopFormPage />} />
              <Route
                path="shop-owner/shops/:shopId"
                element={<ShopOwnerShopFormPage />}
              />
            </Route>

            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route path="admin" element={<AdminDashboardPage />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/shops" element={<AdminShopsPage />} />
              <Route path="admin/orders" element={<AdminOrdersPage />} />
              <Route path="admin/approvals" element={<AdminApprovalsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

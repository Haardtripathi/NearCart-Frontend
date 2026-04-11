import { BrowserRouter, Route, Routes } from 'react-router-dom'

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

export function AppRouter() {
  return (
    <BrowserRouter>
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

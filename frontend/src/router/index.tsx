import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import FestivalLayout from '../layouts/FestivalLayout';
import AuthGuard from './AuthGuard';
import AdminGuard from './AdminGuard';
import HomePage from '../pages/user/HomePage';
import ProductListPage from '../pages/user/ProductListPage';
import ProductDetailPage from '../pages/user/ProductDetailPage';
import CartPage from '../pages/user/CartPage';
import CheckoutPage from '../pages/user/CheckoutPage';
import OrderListPage from '../pages/user/OrderListPage';
import OrderDetailPage from '../pages/user/OrderDetailPage';
import LoginPage from '../pages/user/LoginPage';
import RegisterPage from '../pages/user/RegisterPage';
import ProfilePage from '../pages/user/ProfilePage';
import DashboardPage from '../pages/admin/DashboardPage';
import ProductManagePage from '../pages/admin/ProductManagePage';
import OrderManagePage from '../pages/admin/OrderManagePage';
import UserManagePage from '../pages/admin/UserManagePage';
import CategoryManagePage from '../pages/admin/CategoryManagePage';
import BannerManagePage from '../pages/admin/BannerManagePage';
import KnowledgeManagePage from '../pages/admin/KnowledgeManagePage';
import HumanChatPage from '../pages/admin/HumanChatPage';
import NotFoundPage from '../pages/NotFoundPage';
import FestivalPage from '../pages/festival/FestivalPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      {
        path: 'checkout',
        element: <AuthGuard><CheckoutPage /></AuthGuard>,
      },
      {
        path: 'orders',
        element: <AuthGuard><OrderListPage /></AuthGuard>,
      },
      {
        path: 'orders/:id',
        element: <AuthGuard><OrderDetailPage /></AuthGuard>,
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'profile',
        element: <AuthGuard><ProfilePage /></AuthGuard>,
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminGuard><AdminLayout /></AdminGuard>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <ProductManagePage /> },
      { path: 'orders', element: <OrderManagePage /> },
      { path: 'users', element: <UserManagePage /> },
      { path: 'categories', element: <CategoryManagePage /> },
      { path: 'banners', element: <BannerManagePage /> },
      { path: 'knowledge', element: <KnowledgeManagePage /> },
      { path: 'chat', element: <HumanChatPage /> },
    ],
  },
  {
    path: '/festival',
    element: <FestivalLayout />,
    children: [
      { index: true, element: <FestivalPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export default router;

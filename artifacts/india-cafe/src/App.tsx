import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/react";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminMe } from "@workspace/api-client-react";

// Public Pages
import Home from "@/pages/home";
import Menu from "@/pages/menu";
import About from "@/pages/about";
import Locations from "@/pages/locations";
import Contact from "@/pages/contact";
import Testimonials from "@/pages/testimonials";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderDetail from "@/pages/order";
import TrackOrder from "@/pages/track";
import MyOrders from "@/pages/my-orders";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import DeliveryPhoto from "@/pages/delivery-photo";

// Admin Pages
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminOrders from "@/pages/admin/orders";
import AdminMenu from "@/pages/admin/menu";
import AdminCategories from "@/pages/admin/categories";
import AdminMessages from "@/pages/admin/messages";
import AdminTestimonials from "@/pages/admin/testimonials";

const queryClient = new QueryClient();

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

function AdminRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { data: me, isLoading, error } = useAdminMe();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !me?.authenticated) {
    window.location.href = "/admin";
    return null;
  }

  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Clerk Auth Routes */}
      <Route path="/sign-in/*?">
        {() => <SignInPage />}
      </Route>
      <Route path="/sign-up/*?">
        {() => <SignUpPage />}
      </Route>

      {/* Public Routes */}
      <Route path="/">
        {() => <Layout><Home /></Layout>}
      </Route>
      <Route path="/menu">
        {() => <Layout><Menu /></Layout>}
      </Route>
      <Route path="/about">
        {() => <Layout><About /></Layout>}
      </Route>
      <Route path="/locations">
        {() => <Layout><Locations /></Layout>}
      </Route>
      <Route path="/contact">
        {() => <Layout><Contact /></Layout>}
      </Route>
      <Route path="/testimonials">
        {() => <Layout><Testimonials /></Layout>}
      </Route>
      <Route path="/cart">
        {() => <Layout><Cart /></Layout>}
      </Route>
      <Route path="/checkout">
        {() => <Layout><Checkout /></Layout>}
      </Route>
      <Route path="/order/:id">
        {() => <Layout><OrderDetail /></Layout>}
      </Route>
      <Route path="/track">
        {() => <Layout><TrackOrder /></Layout>}
      </Route>
      <Route path="/my-orders">
        {() => <Layout><MyOrders /></Layout>}
      </Route>
      <Route path="/delivery-photo/:orderNumber">
        {() => <DeliveryPhoto />}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard">
        {() => <AdminRoute component={AdminDashboard} />}
      </Route>
      <Route path="/admin/orders">
        {() => <AdminRoute component={AdminOrders} />}
      </Route>
      <Route path="/admin/menu">
        {() => <AdminRoute component={AdminMenu} />}
      </Route>
      <Route path="/admin/categories">
        {() => <AdminRoute component={AdminCategories} />}
      </Route>
      <Route path="/admin/messages">
        {() => <AdminRoute component={AdminMessages} />}
      </Route>
      <Route path="/admin/testimonials">
        {() => <AdminRoute component={AdminTestimonials} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={base}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;

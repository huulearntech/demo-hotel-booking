import Header from "@/components/header"
import Footer from "@/components/footer"

export default function Layout ({
  children
} : {
  children: React.ReactNode
}) {
  return (
    <>
      <Header className="sticky top-0" />
      <div className="min-h-screen">
        {children}
      </div>
      <Footer />
    </>
  );
}

export const metadata = {
  title: 'Hoteloka - Đặt phòng khách sạn dễ dàng, nhanh chóng',
};
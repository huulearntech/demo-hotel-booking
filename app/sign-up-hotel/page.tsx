import HotelSignUpForm from "./sign-up-form";

export default function HotelSignUpPage() {
  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-4">
        Đăng ký làm đối tác lưu trú với chúng tôi
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Điền vào mẫu dưới đây để bắt đầu quá trình đăng ký và trở thành một phần của mạng lưới lưu trú của chúng tôi. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể để hoàn tất thủ tục và hỗ trợ bạn trong việc thiết lập cơ sở lưu trú của mình trên nền tảng.
      </p>
      <HotelSignUpForm />
    </div>
  );
}
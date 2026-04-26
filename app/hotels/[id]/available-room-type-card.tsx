// TODO: handle error after move this handler to room type page.
// onClick={async () => {
//   const result = await user_createBookingMetadata(
//     roomType.id,
//     searchBarFormData
//   );
//   if (!result.ok) {
//     if (result.status === 400) {
//       toast.error(result.error);
//     } else if (result.status === 401) {
//       toast.error(result.error);
//     }
//     return;
//   } else {
//     // toast.success("Đặt phòng thành công! Chuyển đến trang đặt phòng...");
//     router.push(`${PATHS.bookings}/${result.data}`);
//   }
// }}
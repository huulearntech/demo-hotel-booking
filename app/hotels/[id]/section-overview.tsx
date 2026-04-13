import Image from "next/image";

import { fetchHotel } from "@/lib/actions/hotel";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronRight, MapPin } from 'lucide-react';
import { tvlk_favicon } from "@/public/logos";
import { MAX_REVIEW_POINTS } from "@/lib/constants";
import { formatVND } from "@/lib/utils";
import { fetchPoiCategoriesWithPlaces } from "@/lib/actions/hotel-poi";


export default async function OverviewSection({
  hotel,
  poiCategoriesWithPlaces,
}: {
  hotel: Awaited<ReturnType<typeof fetchHotel>>
  poiCategoriesWithPlaces: Awaited<ReturnType<typeof fetchPoiCategoriesWithPlaces>>
}) {

  if (!hotel) return null;

  const {
    roomTypes: [{ price: minPrice }],
    bookingsMetadata,
    imageUrls,
    facilities,
    ward: { name: wardName, district: { name: districtName, province: { name: provinceName } } },
  } = hotel;

  const places = Object.values(poiCategoriesWithPlaces).flatMap(category => category.places).slice(0, 5); // pick 5

  return (
    <section id="overview" className="w-full flex flex-col">
      <Breadcrumb className="py-1 mb-3">
        {/** TODO: real link to regions */}
        <BreadcrumbList className="text-xs font-semibold">
          <BreadcrumbItem>
            <BreadcrumbLink href="#">{provinceName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">{districtName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">{wardName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">{hotel.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <figure className="rounded-t-4xl overflow-hidden grid gap-2 grid-cols-2 grid-rows-3 md:grid-cols-3 md:grid-rows-2 lg:grid-cols-5 lg:grid-rows-2 lg:h-83">
        {imageUrls.length > 0 &&
          <Image
            src={imageUrls[0]}
            alt=""
            width={400}
            height={300}
            className="object-cover w-full h-full row-span-1 col-span-1 lg:row-span-2 lg:col-span-2"
          />
        }
        {imageUrls.slice(1, 6).map((src, index) => (
          <Image
            key={index}
            src={src}
            alt=""
            width={400}
            height={300}
            className="w-full h-full object-cover"
          />
        ))}
        {imageUrls.length > 6 &&
          <Image
            src={imageUrls[6]}
            alt=""
            width={400}
            height={300}
            className="w-full h-full object-cover hidden lg:block"
          />
        }
      </figure>

      <div className="rounded-b-4xl px-4 py-5 flex flex-col gap-y-5 shadow-xl">
        <div className="flex gap-x-10">
          <div className="flex-1 gap-y-2">
            <h1 className="text-[1.25rem] lg:text-[1.5rem] font-bold">{hotel.name}</h1>
            <div className="flex gap-x-2 items-center">
              <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-primary lowercase first-letter:capitalize">{hotel.type}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-x-2 py-2">
            <div className="flex flex-col text-end">
              <span className="text-xs">Giá/phòng/đêm từ</span>
              <span className="h-fit text-[1.25rem] font-bold text-orange-600">{formatVND(minPrice.toNumber())}</span>
            </div>
            <a
              href="#available_rooms"
              className="font-bold text-white flex items-center bg-orange-600 px-3 py-2 rounded-[0.375rem] h-fit"
            >
              Chọn phòng
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-[0.625rem] px-4 pt-2 pb-4 flex-1 flex-col space-y-3">
            <div className="flex justify-between">
              <div className="flex items-center p-1">
                <Image src={tvlk_favicon} alt="" className="mr-2" />
                <div className="flex items-end text-primary">
                  <div className="text-[1.625rem] font-bold">{hotel.reviewPoints.toFixed(1)}</div>
                  <div className="text-sm font-semibold"> {"/ " + MAX_REVIEW_POINTS} </div>
                </div>
              </div>

              <a href="#review" className="text-sm text-primary flex gap-x-1 font-bold mt-2">
                Xem {hotel.numberOfReviews} đánh giá
                <ChevronRight className="size-5" />
              </a>
            </div>
            <h2 className="font-semibold">Khách nói gì về kỳ nghỉ của họ</h2>
            <div className="flex flex-col overflow-y-auto max-h-32 space-y-2">
              {bookingsMetadata.map(({ user, booking }) => booking && booking.review?.comment && (
                <div key={booking.id} className="flex items-start gap-x-2">
                  <Image
                    src={user.profileImageUrl ?? tvlk_favicon}
                    alt=""
                    className="size-6 rounded-full"
                    width={24}
                    height={24}
                  />
                  <div>
                    <div className="flex items-center gap-x-2">
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-gray-500 text-sm">{booking.review.rating}/{MAX_REVIEW_POINTS}</div>
                    </div>
                    <p className="text-gray-500 text-sm max-h-12 overflow-hidden overflow-ellipsis">{booking.review.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-4 flex-1" >
            <div className="flex items-center justify-between mb-2 font-bold" >
              <h2>Trong khu vực</h2>
              <a href="#location" className="text-sm text-primary flex gap-x-1">
                Xem bản đồ
                <ChevronRight className="size-5" />
              </a>
            </div>
            <div className="flex flex-col gap-y-2 text-sm">
              {places.map((place, index) => (
                <div key={index} className="flex items-start gap-x-2">
                  <MapPin className="size-4 text-gray-500 mt-1" />
                  <div>
                    <div className="flex items-center gap-x-2">
                      <div className="font-semibold">{place.name}</div>
                      <div className="text-gray-500">{place.distance}</div>
                    </div>
                    <div className="text-gray-500">{place.address}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-4 flex-1">
            <div className="flex items-center justify-between mb-2 font-bold">
              <h2>Tiện ích chính</h2>
              <a href="#facilities" className="text-sm text-primary flex gap-x-1">
                Xem thêm
                <ChevronRight className="size-5" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {facilities.filter(facility => !!facility.iconUrl).slice(0,10).map((facility, index) => (
                <div key={index} className="flex items-center gap-x-2">
                  <Image
                    src={facility.iconUrl!}
                    alt=""
                    className="size-4"
                    width={16}
                    height={16}
                  />
                  {facility.name}
                </div>
              ))}
            </div>
          </div>
        </div>


        <div className="bg-white border border-gray-200 rounded-[0.625rem] p-3 flex-1 flex-col space-y-3">
          <p className="text-sm max-h-20 overflow-hidden overflow-ellipsis">{hotel.description}</p>
          <div className="flex gap-x-1 text-sm font-bold text-primary">
            Xem thêm
            <ChevronRight className="size-5" />
          </div>
        </div>
      </div>
    </section>
  )
}
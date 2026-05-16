"use client";

import { useState, useTransition } from "react";
import useSWR from "swr";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getProvinces,
  getWardsByProvinceId,
} from "@/lib/actions/hotel-manager/register";

export default function LocationSelect({
  wardId,
  onWardIdChange,
}: {
  wardId: string;
  onWardIdChange: (wardId: string) => void;
}) {
  const [provinceId, setProvinceId] = useState<string>("");


  const {
    data: provinces = [],
    // error: provincesError,
    isValidating: provincesValidating
  } = useSWR<{ id: string, name: string }[]>(
    "provinces",
    async () => getProvinces()
  );

  const {
    data: wards = [],
    // error: wardsError,
    isValidating: wardsValidating
  } = useSWR<{ id: string, name: string }[]>(
    provinceId ? `wards-${provinceId}` : null,
    async () => getWardsByProvinceId(provinceId)
  );

  const [isPending, startTransition] = useTransition();

  const onProvinceChange = (v: string) => {
    startTransition(() => {
      setProvinceId(v);
      onWardIdChange("");
    });
  };


  return (
    <div className="flex flex-col gap-y-4 lg:flex-row lg:gap-x-4">
      {/* Province */}
      <div className="flex-1">
        <Select value={provinceId} onValueChange={onProvinceChange}>
          <SelectTrigger className="w-full" aria-busy={provincesValidating || isPending}>
            <SelectValue placeholder={provincesValidating ? "Đang tải..." : "Chọn tỉnh/thành phố"} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.id}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>


      {/* Ward */}
      <div className="flex-1">
        <Select value={wardId} onValueChange={onWardIdChange} disabled={!provinceId || wardsValidating || isPending}>
          <SelectTrigger className="w-full" aria-busy={wardsValidating || isPending}>
            <SelectValue placeholder={!provinceId ? "Chọn tỉnh trước" : wardsValidating ? "Đang tải..." : "Chọn phường/xã"} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {wards.map((ward) => (
                <SelectItem key={ward.id} value={ward.id}>
                  {ward.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
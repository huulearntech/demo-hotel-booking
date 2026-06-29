import { CommonFacilitiesTable, CustomFacilitiesTable } from "./facilities-table";
import CreateFacilityDialog from "./create-facility-dialog";
import { ComboboxFindCommonFacilities } from "./combobox-find-common-facilities";

export default function FacilitiesPage() {
  return (
    <div className="flex flex-col gap-y-6">
      <header>
        <h1 className="font-semibold">Quản lý tiện nghi</h1>
        <p className="text-sm text-muted-foreground">
          Thêm, chỉnh sửa hoặc xoá tiện nghi cho khách sạn của bạn.
        </p>
      </header>

      <div className="flex flex-col gap-y-2">
        <div className="flex justify-end">
          <ComboboxFindCommonFacilities />
        </div>
        <CommonFacilitiesTable />
      </div>

      <div className="flex flex-col gap-y-2">
        <div className="flex justify-end">
          <CreateFacilityDialog />
        </div>
        <CustomFacilitiesTable />
      </div>
    </div>
  );
}

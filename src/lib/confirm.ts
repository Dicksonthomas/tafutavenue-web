import Swal from "sweetalert2";

/**
 * Dirisha la uthibitisho (SweetAlert2) linalotumika badala ya confirm() ya
 * kawaida ya browser, kwa muonekano unaolingana na chapa ya app.
 */
export async function confirmAction(
  text: string,
  options: { title?: string; confirmText?: string; danger?: boolean } = {}
): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title ?? "Una uhakika?",
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? "Ndiyo, endelea",
    cancelButtonText: "Ghairi",
    confirmButtonColor: options.danger === false ? "#3db166" : "#dc2626",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
  });

  return result.isConfirmed;
}

import Swal from "sweetalert2";

export async function confirmAction(
  text: string,
  options: { title?: string; confirmText?: string; danger?: boolean } = {}
): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title ?? "Are you sure?",
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? "Yes, continue",
    cancelButtonText: "Cancel",
    confirmButtonColor: options.danger === false ? "#e8573d" : "#dc2626",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
  });

  return result.isConfirmed;
}

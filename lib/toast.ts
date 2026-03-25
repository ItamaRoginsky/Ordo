import { toast } from "sonner";

export const t = {
  success: (msg: string, sub?: string) =>
    toast.success(msg, { description: sub }),

  error: (msg: string, sub?: string) =>
    toast.error(msg, { description: sub }),

  info: (msg: string, sub?: string) =>
    toast.info(msg, { description: sub }),

  promise: <T>(
    p: Promise<T>,
    msgs: { loading: string; success: string; error: string }
  ) => toast.promise(p, msgs),
};

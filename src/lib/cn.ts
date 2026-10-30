/** 轻量 className 组合工具，避免引入额外运行时依赖。 */
export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

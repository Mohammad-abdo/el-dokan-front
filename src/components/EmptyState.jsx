import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, Inbox, Search } from "lucide-react";

const icons = {
  default: Inbox,
  search: Search,
  question: FileQuestion,
};

/**
 * EmptyState - عرض حالة عدم وجود بيانات (shadcn/ui)
 * @param {string} title - عنوان الحالة
 * @param {string} description - وصف اختياري
 * @param {React.ReactNode} icon - أيقونة مخصصة أو اسم: 'default' | 'search' | 'question'
 * @param {React.ReactNode} action - زر أو عنصر إجراء اختياري
 * @param {string} variant - 'card' | 'inline' (inline داخل جدول بدون إطار)
 * @param {string} className - كلاسات إضافية
 */
export function EmptyState({
  title,
  description,
  icon = "default",
  action,
  variant = "card",
  className = "",
}) {
  const IconComponent = typeof icon === "string" ? icons[icon] || icons.default : icon;
  const content = (
    <>
      <div className="rounded-full bg-muted p-4 mb-4">
        {typeof IconComponent === "function" ? (
          <IconComponent className="h-10 w-10 text-muted-foreground" />
        ) : (
          icon
        )}
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </>
  );

  if (variant === "inline") {
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {content}
      </CardContent>
    </Card>
  );
}

export default EmptyState;

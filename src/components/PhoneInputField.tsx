import PhoneInput, { type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { cn } from "@/lib/utils";

export type PhoneFieldValue = Value;

type PhoneInputFieldProps = {
  id?: string;
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  "aria-invalid"?: boolean;
};

export function PhoneInputField({
  id,
  value,
  onChange,
  disabled,
  className,
  placeholder,
  "aria-invalid": ariaInvalid,
}: PhoneInputFieldProps) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry="US"
      countryCallingCodeEditable={false}
      limitMaxLength
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={cn("app-phone-input", className)}
      numberInputProps={{
        "aria-invalid": ariaInvalid,
      }}
    />
  );
}

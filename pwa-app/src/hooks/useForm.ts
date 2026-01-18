'use client';

import { useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';

/**
 * Validation rule function type
 */
export type ValidationRule<T> = (value: T, formValues: Record<string, unknown>) => string | undefined;

/**
 * Field configuration
 */
export interface FieldConfig<T = string> {
  /** Initial value */
  initialValue: T;
  /** Validation rules (run in order, first error wins) */
  validate?: ValidationRule<T>[];
  /** Transform value before setting */
  transform?: (value: T) => T;
  /** Required field */
  required?: boolean | string;
}

/**
 * Field state
 */
export interface FieldState<T = string> {
  value: T;
  error: string | undefined;
  touched: boolean;
  dirty: boolean;
}

/**
 * Form configuration
 */
export type FormConfig<T extends Record<string, unknown>> = {
  [K in keyof T]: FieldConfig<T[K]>;
};

/**
 * Form state
 */
export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

/**
 * Form actions
 */
export interface FormActions<T extends Record<string, unknown>> {
  /** Set a field value */
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Set multiple field values */
  setValues: (values: Partial<T>) => void;
  /** Set a field error */
  setError: <K extends keyof T>(field: K, error: string | undefined) => void;
  /** Set multiple field errors */
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  /** Mark a field as touched */
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  /** Reset form to initial values */
  reset: () => void;
  /** Validate all fields */
  validateAll: () => boolean;
  /** Validate a single field */
  validateField: <K extends keyof T>(field: K) => string | undefined;
  /** Handle input change */
  handleChange: (field: keyof T) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** Handle input blur */
  handleBlur: (field: keyof T) => () => void;
  /** Handle form submit */
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e: FormEvent) => void;
  /** Get field props for binding to input */
  getFieldProps: (field: keyof T) => {
    value: T[keyof T];
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  };
}

/**
 * Common validation rules
 */
export const validators = {
  required: (message = 'This field is required'): ValidationRule<string> => (value) =>
    !value || value.trim() === '' ? message : undefined,

  minLength: (min: number, message?: string): ValidationRule<string> => (value) =>
    value && value.length < min
      ? message || `Must be at least ${min} characters`
      : undefined,

  maxLength: (max: number, message?: string): ValidationRule<string> => (value) =>
    value && value.length > max
      ? message || `Must be at most ${max} characters`
      : undefined,

  pattern: (regex: RegExp, message: string): ValidationRule<string> => (value) =>
    value && !regex.test(value) ? message : undefined,

  email: (message = 'Invalid email address'): ValidationRule<string> => (value) =>
    value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? message : undefined,

  phone: (message = 'Invalid phone number'): ValidationRule<string> => (value) =>
    value && !/^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(value.replace(/\s/g, ''))
      ? message
      : undefined,

  date: (message = 'Invalid date (use YYYY-MM-DD)'): ValidationRule<string> => (value) => {
    if (!value) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return message;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
      ? undefined
      : message;
  },

  currency: (message = 'Invalid amount'): ValidationRule<string> => (value) => {
    if (!value) return undefined;
    const num = parseFloat(value.replace(/[$,]/g, ''));
    return isNaN(num) || num < 0 ? message : undefined;
  },

  match: <T>(fieldName: keyof T, message?: string): ValidationRule<string> => (value, formValues) =>
    value !== formValues[fieldName as string]
      ? message || `Must match ${String(fieldName)}`
      : undefined,

  custom: <T>(fn: (value: T, formValues: Record<string, unknown>) => boolean, message: string): ValidationRule<T> =>
    (value, formValues) => fn(value, formValues) ? undefined : message,
};

/**
 * Hook for form state management with validation
 */
export function useForm<T extends Record<string, unknown>>(
  config: FormConfig<T>
): [FormState<T>, FormActions<T>] {
  // Extract initial values
  const initialValues = useMemo(() => {
    const values: Partial<T> = {};
    for (const key in config) {
      values[key as keyof T] = config[key].initialValue;
    }
    return values as T;
  }, [config]);

  // State
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [dirty, setDirty] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed state
  const isValid = useMemo(
    () => Object.keys(errors).every((k) => !errors[k as keyof T]),
    [errors]
  );

  const isDirty = useMemo(
    () => Object.values(dirty).some(Boolean),
    [dirty]
  );

  // Validate a single field
  const validateField = useCallback(
    <K extends keyof T>(field: K): string | undefined => {
      const fieldConfig = config[field];
      const value = values[field];

      // Check required
      if (fieldConfig.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return typeof fieldConfig.required === 'string'
          ? fieldConfig.required
          : 'This field is required';
      }

      // Run validation rules
      if (fieldConfig.validate) {
        for (const rule of fieldConfig.validate) {
          const error = rule(value, values as Record<string, unknown>);
          if (error) return error;
        }
      }

      return undefined;
    },
    [config, values]
  );

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let valid = true;

    for (const field in config) {
      const error = validateField(field as keyof T);
      if (error) {
        newErrors[field as keyof T] = error;
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  }, [config, validateField]);

  // Actions
  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      const fieldConfig = config[field];
      const transformedValue = fieldConfig.transform
        ? fieldConfig.transform(value)
        : value;

      setValues((prev) => ({ ...prev, [field]: transformedValue }));
      setDirty((prev) => ({ ...prev, [field]: transformedValue !== initialValues[field] }));
    },
    [config, initialValues]
  );

  const setValuesAction = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
    const newDirty: Partial<Record<keyof T, boolean>> = {};
    for (const key in newValues) {
      newDirty[key as keyof T] = newValues[key] !== initialValues[key as keyof T];
    }
    setDirty((prev) => ({ ...prev, ...newDirty }));
  }, [initialValues]);

  const setError = useCallback(
    <K extends keyof T>(field: K, error: string | undefined) => {
      setErrors((prev) => {
        if (error === undefined) {
          const { [field]: _, ...rest } = prev;
          return rest as Partial<Record<keyof T, string>>;
        }
        return { ...prev, [field]: error };
      });
    },
    []
  );

  const setErrorsAction = useCallback(
    (newErrors: Partial<Record<keyof T, string>>) => {
      setErrors(newErrors);
    },
    []
  );

  const setTouchedAction = useCallback(
    <K extends keyof T>(field: K, isTouched = true) => {
      setTouched((prev) => ({ ...prev, [field]: isTouched }));
    },
    []
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setDirty({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleChange = useCallback(
    (field: keyof T) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
        setValue(field, value as T[keyof T]);
      },
    [setValue]
  );

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouchedAction(field, true);
      const error = validateField(field);
      setError(field, error);
    },
    [setTouchedAction, validateField, setError]
  );

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) =>
      async (e: FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched
        const allTouched: Partial<Record<keyof T, boolean>> = {};
        for (const key in config) {
          allTouched[key as keyof T] = true;
        }
        setTouched(allTouched);

        // Validate all fields
        if (!validateAll()) return;

        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      },
    [config, validateAll, values]
  );

  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: values[field] as T[keyof T],
      onChange: handleChange(field),
      onBlur: handleBlur(field),
      'aria-invalid': !!errors[field] && !!touched[field],
      'aria-describedby': errors[field] && touched[field] ? `${String(field)}-error` : undefined,
    }),
    [values, errors, touched, handleChange, handleBlur]
  );

  const state: FormState<T> = {
    values,
    errors,
    touched,
    dirty,
    isValid,
    isDirty,
    isSubmitting,
  };

  const actions: FormActions<T> = {
    setValue,
    setValues: setValuesAction,
    setError,
    setErrors: setErrorsAction,
    setTouched: setTouchedAction,
    reset,
    validateAll,
    validateField,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps,
  };

  return [state, actions];
}

export default useForm;

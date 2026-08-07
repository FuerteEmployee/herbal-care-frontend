import { Controller } from 'react-hook-form'
import { TextField, TextAreaField, SelectField, MultiSelectField, KeyValueRows } from '../ui/FormField'

export function RHFTextField({ register, name, error, registerOptions, ...rest }) {
  return <TextField {...register(name, registerOptions)} error={error?.message} {...rest} />
}

export function RHFNumberField({ register, name, error, ...rest }) {
  return <TextField type="number" {...register(name, { valueAsNumber: true })} error={error?.message} {...rest} />
}

export function RHFTextArea({ register, name, error, ...rest }) {
  return <TextAreaField {...register(name)} error={error?.message} {...rest} />
}

export function RHFSelectField({ register, name, error, ...rest }) {
  return <SelectField {...register(name)} error={error?.message} {...rest} />
}

export function RHFMultiSelectField({ control, name, error, ...rest }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <MultiSelectField value={field.value ?? []} onChange={field.onChange} {...rest} />
      )}
    />
  )
}

export function RHFKeyValueRows({ control, name, ...rest }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => <KeyValueRows rows={field.value ?? []} onChange={field.onChange} {...rest} />}
    />
  )
}

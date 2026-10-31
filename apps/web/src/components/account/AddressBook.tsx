"use client";

import { useState, useTransition } from "react";
import {
  ADDRESS_LABELS,
  formatIndianMobile,
  INDIAN_STATES,
  type AddressFormInput,
} from "@toyshop/shared";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/app/(shop)/account/actions";
import { Badge, Button, Card, describedBy, Field, Input, Select, TobySays } from "@/components/ui";
import { cn } from "@/lib/cn";

export type Address = {
  id: string;
  label: (typeof ADDRESS_LABELS)[number];
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

const EMPTY: AddressFormInput = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "Tamil Nadu",
  pincode: "",
  isDefault: false,
};

export function AddressBook({ addresses, defaultName, defaultPhone }: { addresses: Address[]; defaultName: string; defaultPhone: string }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  const toForm = (address: Address): AddressFormInput => ({
    label: address.label,
    fullName: address.full_name,
    phone: address.phone.replace(/^\+91/, ""),
    line1: address.line1,
    line2: address.line2,
    landmark: address.landmark,
    city: address.city,
    state: address.state as AddressFormInput["state"],
    pincode: address.pincode,
    isDefault: address.is_default,
  });

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && editing !== "new" && (
        <TobySays title="No addresses yet">Add one now and checkout will be super quick later.</TobySays>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {addresses.map((address) =>
          editing === address.id ? (
            <li key={address.id} className="md:col-span-2">
              <AddressForm
                addressId={address.id}
                initial={toForm(address)}
                onDone={() => setEditing(null)}
              />
            </li>
          ) : (
            <li key={address.id}>
              <Card className={cn("flex h-full flex-col gap-3", address.is_default && "border-sunshine-dark")}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color="sky">{address.label === "Home" ? "🏠" : address.label === "Work" ? "🏢" : "📍"} {address.label}</Badge>
                  {address.is_default && <Badge color="sunshine">⭐ Default</Badge>}
                </div>
                <address className="not-italic leading-relaxed">
                  <strong>{address.full_name}</strong>
                  <br />
                  {address.line1}
                  {address.line2 && <>, {address.line2}</>}
                  <br />
                  {address.landmark && <>Near {address.landmark}<br /></>}
                  {address.city}, {address.state} – {address.pincode}
                  <br />
                  📞 {formatIndianMobile(address.phone)}
                </address>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(address.id)}>
                    ✏️ Edit
                  </Button>
                  {!address.is_default && (
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(() => setDefaultAddress(address.id))}>
                      Make default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm("Delete this address?")) startTransition(() => deleteAddress(address.id));
                    }}
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </Card>
            </li>
          ),
        )}
      </ul>

      {editing === "new" ? (
        <AddressForm
          addressId={null}
          initial={{ ...EMPTY, fullName: defaultName, phone: defaultPhone.replace(/^\+91/, "") }}
          onDone={() => setEditing(null)}
        />
      ) : (
        <Button className="self-start" onClick={() => setEditing("new")}>
          ➕ Add an address
        </Button>
      )}
    </div>
  );
}

function AddressForm({
  addressId,
  initial,
  onDone,
}: {
  addressId: string | null;
  initial: AddressFormInput;
  onDone: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const prefix = addressId ?? "new";

  const bind = (key: keyof AddressFormInput) => ({
    id: `${prefix}-${key}`,
    value: String(values[key] ?? ""),
    onChange: (event: { target: { value: string } }) => {
      setValues({ ...values, [key]: event.target.value });
      if (errors[key]) setErrors({ ...errors, [key]: "" });
    },
    ...describedBy(`${prefix}-${key}`, { error: errors[key] }),
  });

  return (
    <Card className="border-sunshine-dark">
      <h3 className="text-xl">{addressId ? "Edit address" : "New address"}</h3>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await saveAddress(addressId, values);
            if (result.errors) setErrors(result.errors);
            else onDone();
          });
        }}
      >
        <Field id={`${prefix}-fullName`} label="Receiver's name" required error={errors.fullName}>
          <Input {...bind("fullName")} autoComplete="name" />
        </Field>
        <Field id={`${prefix}-phone`} label="Mobile number" required error={errors.phone}>
          <Input {...bind("phone")} inputMode="tel" autoComplete="tel" placeholder="98765 43210" />
        </Field>
        <div className="sm:col-span-2">
          <Field id={`${prefix}-line1`} label="House / flat no., building, street" required error={errors.line1}>
            <Input {...bind("line1")} autoComplete="address-line1" />
          </Field>
        </div>
        <Field id={`${prefix}-line2`} label="Area / locality" error={errors.line2}>
          <Input {...bind("line2")} autoComplete="address-line2" />
        </Field>
        <Field id={`${prefix}-landmark`} label="Landmark" error={errors.landmark}>
          <Input {...bind("landmark")} placeholder="e.g. near the temple" />
        </Field>
        <Field id={`${prefix}-pincode`} label="Pincode" required error={errors.pincode}>
          <Input {...bind("pincode")} inputMode="numeric" maxLength={6} autoComplete="postal-code" />
        </Field>
        <Field id={`${prefix}-city`} label="Town / city" required error={errors.city}>
          <Input {...bind("city")} autoComplete="address-level2" />
        </Field>
        <Field id={`${prefix}-state`} label="State" required error={errors.state}>
          <Select {...bind("state")} autoComplete="address-level1">
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset>
          <legend className="font-heading text-lg">Save as</legend>
          <div className="mt-1.5 flex gap-2">
            {ADDRESS_LABELS.map((label) => (
              <button
                key={label}
                type="button"
                aria-pressed={values.label === label}
                onClick={() => setValues({ ...values, label })}
                className={cn(
                  "rounded-full border-2 px-4 py-1.5 text-sm font-bold",
                  values.label === label ? "border-sunshine-dark bg-sunshine" : "border-ink/15 bg-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(values.isDefault)}
            onChange={(event) => setValues({ ...values, isDefault: event.target.checked })}
            className="size-5 accent-bubblegum-dark"
          />
          Make this my default address
        </label>
        {errors.form && <p role="alert" className="font-bold text-bubblegum-dark sm:col-span-2">{errors.form}</p>}
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save address ✓"}
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

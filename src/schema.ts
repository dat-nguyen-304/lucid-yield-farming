import { Data, type Network, type Exact, type TSchema } from '@lucid-evolution/lucid';

export const ScriptKeyHash = Data.Bytes({ minLength: 28, maxLength: 28 });
export const PublicKeyHash = Data.Bytes({ minLength: 28, maxLength: 28 });

export const CredentialSchema = Data.Enum([
  Data.Object({
    VerificationKeyCredential: Data.Tuple([PublicKeyHash]),
  }),
  Data.Object({
    ScriptCredential: Data.Tuple([ScriptKeyHash]),
  }),
]);

export const StakeCredentialSchema = Data.Enum([
  Data.Object({
    Inline: Data.Tuple([CredentialSchema]),
  }),
  Data.Object({
    Pointer: Data.Object({
      slotNumber: Data.Integer(),
      transactionIndex: Data.Integer(),
      certificateIndex: Data.Integer(),
    }),
  }),
]);

export const AddressSchema = Data.Object({
  paymentCredential: CredentialSchema,
  stakeCredential: Data.Nullable(StakeCredentialSchema),
});

export const PolicyIdSchema = Data.Bytes({ minLength: 0, maxLength: 28 });

export const TupleAssetSchema = Data.Tuple([Data.Bytes(), Data.Bytes()]);

export const PRationalSchema = Data.Object({
  numerator: Data.Integer(),
  denominator: Data.Integer(),
});

export const OutRefSchema = Data.Object({
  txHash: Data.Bytes({ minLength: 32, maxLength: 32 }),
  index: Data.Integer(),
});

export const NegativeInfinitySchema = Data.Object({ NegativeInfinity: Data.Tuple([]) });
export const FiniteSchema = Data.Object({ Finite: Data.Tuple([Data.Integer()]) });
export const PositiveInfinitySchema = Data.Object({ PositiveInfinity: Data.Tuple([]) });
export const IntervalBoundSchema = Data.Object({
  bound_type: Data.Enum([NegativeInfinitySchema, FiniteSchema, PositiveInfinitySchema]),
  is_inclusive: Data.Boolean(),
});
export const IntervalSchema = Data.Object({
  lower_bound: IntervalBoundSchema,
  upper_bound: IntervalBoundSchema,
});

export const NoDatumSchema = Data.Object({ NoDatum: Data.Tuple([]) });
export const DatumHashSchema = Data.Object({ DataHash: Data.Tuple([Data.Bytes({ minLength: 32, maxLength: 32 })]) });
export const InlineDatumSchema = Data.Object({ Data: Data.Tuple([Data.Any()]) });
export const DatumSchema = Data.Enum([NoDatumSchema, DatumHashSchema, InlineDatumSchema]);

export const MintSchema = Data.Object({ Mint: Data.Tuple([PolicyIdSchema]) });
export const SpendSchema = Data.Object({ Spend: Data.Tuple([OutRefSchema]) });
export const WithdrawSchema = Data.Object({ Withdraw: Data.Tuple([CredentialSchema]) });
export const ScriptPurposeSchema = Data.Enum([MintSchema, SpendSchema, WithdrawSchema]);

export const ReferenceScriptSchema = Data.Nullable(Data.Bytes());
export const RedeemersSchema = Data.Map(ScriptPurposeSchema, Data.Bytes());
export const ExtraSignatoriesSchema = Data.Array(Data.Bytes());

/**
 * Encodes data using the provided schema.
 *
 * @param data - The data to encode
 * @param schema - The schema to use for encoding
 * @param options - Optional encoding options
 * @returns The encoded data as a hex string
 * @throws error when the `data` doesn't match the `schema`
 */
export function encodeData<T extends TSchema>(
  data: Exact<Data.Static<T>>,
  schema?: T,
  options?: {
    canonical?: boolean;
  }
): string {
  return Data.to<Data.Static<T>>(data, schema, options);
}
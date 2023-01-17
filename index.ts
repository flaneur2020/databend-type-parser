enum TypeKind {
    Int8 = "int8",
    Int16 = "int16",
    Int32 = "int32",
    Int64 = "int64",
    UInt8 = "uint8",
    UInt16 = "uint16",
    UInt32 = "uint32",
    UInt64 = "uint64",
    Float32 = "float32",
    Float64 = "float64",
    Variant = "fariant",
    JSON = "json",
    Date = "date",
    Timestamp = "timestamp",
    String = "string",
    Array = "array",
    Nullable = "nullable",
}

function parseTypeKind(s: string): TypeKind | undefined {
    let t = s.toLowerCase()
    if (Object.values(TypeKind).includes(t as TypeKind)) {
        return t as TypeKind;
    }
    return undefined;
}

function isNumericType(t: TypeKind): boolean {
    let typeString: string = t as string;
    return typeString.includes("int") || typeString.includes("float") || typeString.includes("decimal");
}

function isComposedType(t: TypeKind): boolean {
    return [TypeKind.Array, TypeKind.Nullable].includes(t)
}

function isNullableType(t: TypeKind): boolean {
    return TypeKind.Nullable === t;
}

type ParseError = {
    error: "unknown_type" | "eof" | "todo" | "empty_input" | "invalid_type";
    message?: string;
};

function isParseError(obj: any): obj is ParseError {
    return 'error' in obj;
}

type ColumnType = {
  type: TypeKind;
  children: Array<ColumnType>;
  isNumeric: boolean;
  isNullable: boolean;
};

function parseColumnTypeByTokens(tokens: Array<string>): ColumnType | ParseError {
    if (tokens.length == 0) {
        return { error: "eof" }
    }

    let typeKind = parseTypeKind(tokens[0])
    if (!typeKind) {
        return { error: "unknown_type", message: `unknown type ${tokens[0]}` }
    }

    let columnType: ColumnType = {
        type: typeKind,
        children: [],
        isNumeric: isNumericType(typeKind),
        isNullable: isNullableType(typeKind),
    }

    if (isComposedType(typeKind)) {
        let nextTokens = tokens.slice(1, tokens.length);
        console.log(`tokens: ${tokens}, next Tokens: ${nextTokens}`);
        let r = parseColumnTypeByTokens(nextTokens)
        if (isParseError(r)) {
            return r;
        }
        columnType.children = [r as ColumnType]
    }

    return columnType
}

function parseColumnType(t: string, unwrapNullable: boolean): ColumnType | ParseError {
    let tokens = t.match(/\w+/g)
    if (!tokens) {
        return { error: "empty_input" }
    }

    let r = parseColumnTypeByTokens(tokens)
    if (isParseError(r)) {
        return r;
    }

    if (unwrapNullable && isNullableType(r.type)) {
        if (r.children.length == 0) {
            return { error: "invalid_type", message: "no child type in Nullable" }
        }
        r = r.children[0];
        r.isNullable = true
    }

    return r
}

console.log(parseTypeKind("nullable"));
console.log(parseTypeKind("blah"));
console.log(isNumericType(TypeKind.String));
console.log(parseColumnType("Nullable(Array(UInt32))", true));
console.log(parseColumnType("Nullable(Array(Nullable(UInt32)))", true));
console.log(parseColumnType("Array(UInt32)", true));

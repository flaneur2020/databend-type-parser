enum TypeKind {
    Int8 = "Int8",
    Int16 = "Int16",
    Int32 = "Int32",
    Int64 = "Int64",
    UInt8 = "UInt8",
    UInt16 = "UInt16",
    UInt32 = "UInt32",
    UInt64 = "UInt64",
    Float32 = "Float32",
    Float64 = "Float64",
    Variant = "Variant",
    JSON = "JSON",
    String = "String",
    Array = "Array",
    Nullable = "Nullable",
}

function parseTypeKind(t: string): TypeKind | undefined {
    return (<any>TypeKind)[t];
}

function isNumericType(t: TypeKind): boolean {
    let typeString: string = TypeKind[t];
    return typeString.includes("Int") || typeString.includes("Float") || typeString.includes("decimal");
}

function isComposedType(t: TypeKind): boolean {
    return [TypeKind.Array, TypeKind.Nullable].includes(t)
}

type ParseError = {
    error: "unknown_type" | "eof" | "todo" | "empty_input";
    message?: string;
};

function isParseError(obj: any): obj is ParseError {
    return 'error' in obj;
}

type ColumnType = {
  type: TypeKind;
  child?: ColumnType;
  isNumeric: boolean;
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
        isNumeric: isNumericType(typeKind),
    }

    if (isComposedType(typeKind)) {
        let nextTokens = tokens.slice(1, tokens.length);
        console.log(`tokens: ${tokens}, next Tokens: ${nextTokens}`);
        let r = parseColumnTypeByTokens(nextTokens)
        if (isParseError(r)) {
            return r;
        }
        columnType.child = r as ColumnType
    }

    return columnType
}

function parseColumnType(t: string): ColumnType | ParseError {
    let tokens = t.match(/\w+/g)
    if (!tokens) {
        return { error: "empty_input" }
    }
    return parseColumnTypeByTokens(tokens)
}

console.log(parseTypeKind("Nullable"));
console.log(parseTypeKind("blah"));
console.log(isNumericType(TypeKind.String));
console.log(parseColumnType("Nullable(Array(UInt32))"));
console.log(parseColumnType("Array(UInt32)"));

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
    Tuple = "tuple",
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
    return [TypeKind.Array, TypeKind.Tuple, TypeKind.Nullable].includes(t)
}

function isNullableType(t: TypeKind): boolean {
    return TypeKind.Nullable === t;
}

class Tokener {
    tokens: Array<string>;

    constructor(tokens: Array<string>) {
        this.tokens = tokens;
    }

    nextToken(): string | undefined {
        if (this.tokens.length == 0) {
            return undefined;
        }
        let t = this.tokens[0];
        this.tokens = this.tokens.slice(1, this.tokens.length);
        return t;
    }

    peekToken(): string | undefined {
        if (this.tokens.length == 0) {
            return undefined;
        }
        return this.tokens[0];
    }
}

type ParseError = {
    error: "unknown_type" | "unexpected_token" | "eof" | "todo" | "empty_input" | "invalid_type";
    message?: string;
};

function isParseError(obj: any): obj is ParseError {
    if (! obj) {
        return false
    }
    return 'error' in obj;
}

type ColumnType = {
  type: TypeKind;
  children: Array<ColumnType>;
  isNumeric: boolean;
  isNullable: boolean;
};

function parseExpectedToken(tokener: Tokener, want: string): ParseError | undefined {
    let t = tokener.nextToken()
    if (! t) {
        return { error: "eof" }
    }
    if (t !== want) {
        return { error: "unexpected_token", message: `expected ${want}, but got ${t}` }
    }
}

function parseColumnTypeInner(tokener: Tokener): ColumnType | ParseError {
    let token = tokener.nextToken()
    if (! token) {
        return { error: "eof" }
    }

    let typeKind = parseTypeKind(token)
    if (!typeKind) {
        return { error: "unknown_type", message: `unknown type ${token}` }
    }

    let columnType: ColumnType = {
        type: typeKind,
        children: [],
        isNumeric: isNumericType(typeKind),
        isNullable: isNullableType(typeKind),
    }

    if (isComposedType(typeKind)) {
        let lparen = parseExpectedToken(tokener, "(")
        if (isParseError(lparen)) {
            return lparen;
        }

        while (true) {
            let childColumnType = parseColumnTypeInner(tokener)
            if (isParseError(columnType)) {
                return columnType;
            }
            columnType.children.push(childColumnType as ColumnType)

            let t = tokener.peekToken()
            if (t !== ",") {
                break
            }
            tokener.nextToken()
        }
        let rparen = parseExpectedToken(tokener, ")")
        if (isParseError(rparen)) {
            return rparen;
        }
    }

    return columnType
}

function parseColumnType(t: string, unwrapNullable: boolean): ColumnType | ParseError {
    let tokens = t.match(/\w+|\(|\)|,/g)
    if (!tokens || tokens.length == 0) {
        return { error: "empty_input" }
    }

    let tokener = new Tokener(tokens)
    let r = parseColumnTypeInner(tokener)
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

// console.log(parseColumnType("Nullable(Array(Nullable(UInt32)))", true));

let t = parseColumnType("Nullable(Array(Tuple(UInt32, UInt16)))", true) as ColumnType;
console.log(t.children[0]);

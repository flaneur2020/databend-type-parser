enum TypeName {
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
    String = "String",
    Array = "Array",
    Nullable = "Nullable",
}

function parseTypeName(t: string): TypeName | undefined {
    return (<any>TypeName)[t];
}

function isNumericType(t: TypeName): boolean {
    let typeString: string = TypeName[t];
    return typeString.includes("Int") || typeString.includes("Float") || typeString.includes("decimal");
}

function isComposedType(t: TypeName): boolean {
    return [TypeName.Array, TypeName.Nullable].includes(t)
}

type ParseError = {
    error: "unknown_type" | "eof" | "todo" | "empty_input";
    message?: string;
};

function isParseError(obj: any): obj is ParseError {
    return 'error' in obj;
}

type ColumnType = {
  type: TypeName;
  child?: ColumnType;
  isNumeric: boolean;
};

function parseColumnTypeByTokens(tokens: Array<string>): ColumnType | ParseError {
    if (tokens.length == 0) {
        return { error: "eof" }
    }

    let typeName = parseTypeName(tokens[0])
    if (!typeName) {
        return { error: "unknown_type", message: `unknown type ${tokens[0]}` }
    }

    let columnType: ColumnType = {
        type: typeName,
        isNumeric: isNumericType(typeName),
    }

    if (isComposedType(typeName)) {
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

console.log(parseTypeName("Nullable"));
console.log(parseTypeName("blah"));
console.log(isNumericType(TypeName.String));
console.log(parseColumnType("Nullable(Array(UInt32))"));

const AWS = require("aws-sdk");
const { validarToken } = require("./utils/auth");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

module.exports.crearProducto = async (event) => {
  try {
    const tenant_id = validarToken(event);
    const body = JSON.parse(event.body);

    const item = {
      tenant_id,
      codigo: body.codigo,
      nombre: body.nombre,
      precio: body.precio,
      stock: body.stock
    };

    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: item
    }).promise();

    return { statusCode: 201, body: JSON.stringify({ message: "Producto creado" }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};

module.exports.listarProductos = async (event) => {
  try {
    const tenant_id = validarToken(event);
    const limit = parseInt(event.queryStringParameters?.limit || "10");
    const startKey = event.queryStringParameters?.startKey;

    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "tenant_id = :tenant_id",
      ExpressionAttributeValues: { ":tenant_id": tenant_id },
      Limit: limit
    };

    if (startKey) {
      params.ExclusiveStartKey = { tenant_id, codigo: startKey };
    }

    const result = await dynamodb.query(params).promise();
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};

module.exports.buscarProducto = async (event) => {
  try {
    const tenant_id = validarToken(event);
    const codigo = event.pathParameters.codigo;

    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { tenant_id, codigo }
    }).promise();

    if (!result.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "Producto no encontrado" }) };
    }

    return { statusCode: 200, body: JSON.stringify(result.Item) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};

module.exports.modificarProducto = async (event) => {
  try {
    const tenant_id = validarToken(event);
    const codigo = event.pathParameters.codigo;
    const body = JSON.parse(event.body);

    const params = {
      TableName: TABLE_NAME,
      Key: { tenant_id, codigo },
      UpdateExpression: "SET nombre = :n, precio = :p, stock = :s",
      ExpressionAttributeValues: {
        ":n": body.nombre,
        ":p": body.precio,
        ":s": body.stock
      }
    };

    await dynamodb.update(params).promise();
    return { statusCode: 200, body: JSON.stringify({ message: "Producto actualizado" }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};

module.exports.eliminarProducto = async (event) => {
  try {
    const tenant_id = validarToken(event);
    const codigo = event.pathParameters.codigo;

    await dynamodb.delete({
      TableName: TABLE_NAME,
      Key: { tenant_id, codigo }
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ message: "Producto eliminado" }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};


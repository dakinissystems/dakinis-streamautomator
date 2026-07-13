export function sequelizeErrorMessage(err) {
  return err?.original?.message || err?.parent?.message || err?.message || 'unknown_error';
}

export function sequelizeErrorCode(err) {
  return err?.original?.code || err?.parent?.code || null;
}

export function isSchemaMissingError(err) {
  const code = sequelizeErrorCode(err);
  const message = sequelizeErrorMessage(err);
  return code === '42P01' || /relation .* does not exist|column .* does not exist/i.test(message);
}

export function shouldExposeDbErrorDetails() {
  return process.env.NODE_ENV !== 'production' || process.env.STREAMAUTOMATOR_EXPOSE_ERROR_DETAILS === 'true';
}

export function mapSequelizeRouteError(err, { defaultMessage, schemaMessage }) {
  const message = sequelizeErrorMessage(err);
  const code = sequelizeErrorCode(err);
  if (isSchemaMissingError(err)) {
    return {
      status: 503,
      body: {
        error: schemaMessage,
        code: 'schema_out_of_date',
        details: shouldExposeDbErrorDetails() ? message : undefined,
      },
    };
  }
  return {
    status: 500,
    body: {
      error: defaultMessage,
      code: 'database_error',
      details: shouldExposeDbErrorDetails() ? message : undefined,
      pgCode: shouldExposeDbErrorDetails() ? code : undefined,
    },
  };
}

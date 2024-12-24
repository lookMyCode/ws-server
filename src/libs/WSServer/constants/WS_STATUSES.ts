export const WS_STATUSES = Object.freeze({
  OK: {
    code: 4200,
    status: 'OK',
  },
  CREATED: {
    code: 4201,
    status: 'Created',
  },

  UNAUTHORIZED: {
    code: 4401,
    status: 'Unauthorized',
  },
  ACCESS_DENIED: {
    code: 4403,
    status: 'Access Denied',
  },
  NOT_FOUND: {
    code: 4404,
    status: 'Not Found',
  },
  
  INTERNAL_SERVER_ERROR: {
    code: 4500,
    status: 'Internal Server Error',
  },
});

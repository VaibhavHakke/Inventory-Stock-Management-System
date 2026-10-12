module.exports = (err, req, res, next) => {
  console.error(err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON request body' });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'That value already exists.' });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ message: 'Choose existing related records before saving.' });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'This frontend origin is not allowed by the API.' });
  }

  return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
};

// Middleware: require authenticated session
exports.requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    // API request vs browser request
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    return res.redirect('/login');
  }
  next();
};

// Middleware: require technician role
exports.requireTechnician = (req, res, next) => {
  if (req.session.userRole !== 'technician') {
    return res.status(403).json({ error: 'Technician access required.' });
  }
  next();
};

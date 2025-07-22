export const register = (req, res) => {
  console.log('Register Request Body:', req.body);
  res.status(200).json({ message: 'Register endpoint reached (no DB yet)' });
};

export const login = (req, res) => {
  console.log('Login Request Body:', req.body);
  res.status(200).json({ message: 'Login endpoint reached (no DB yet)' });
};

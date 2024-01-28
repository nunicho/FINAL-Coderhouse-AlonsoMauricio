const getUsersDTO = (users) => {
  return users.map((user) => ({
    id: user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
  }));
};

module.exports = getUsersDTO;

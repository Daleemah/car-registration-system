
const paginate = (page, limit) => {
  const currentPage = Math.max(page, 1);
  
  const perPage = Math.min(limit, 100);

  return {
    skip: (currentPage - 1) * perPage,
    limit: perPage
  };
};

module.exports = paginate;
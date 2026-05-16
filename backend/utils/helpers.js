const formatResults = (results) => {
    return results.map(r => ({
        ...r,
        total_votes: parseInt(r.total_votes) || 0
    }));
};

module.exports = { formatResults };
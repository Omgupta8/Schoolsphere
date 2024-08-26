const con = require("../config/db.js");

exports.addSchool = (req, res) => {
  const data = req.body;
  const trimdata = {
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
  };
 
  // console.log(trimdata);
  if (!trimdata.latitude || !trimdata.longitude) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required" });
  }

  const query = "SELECT * FROM schools WHERE latitude = ? AND longitude = ?";
  con.query(query, [trimdata.latitude, trimdata.longitude], (err, results) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      return res.status(400).json({
        message: "School already exists in the table",
      });
    } else {
      const insertQuery = "INSERT INTO schools SET ?";
      con.query(insertQuery, trimdata, (err, result) => {
        if (err) {
          console.error("Error inserting data:", err);
          return res.status(500).json({ error: "Database error" });
        }

        return res.status(201).json({
          message: "School added successfully",
          schoolId: result.insertId,
          data: trimdata,
        });
      });
    }
  });
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

exports.listSchools = (req, res) => {
  const { latitude, longitude } = req.query;
  // console.log("hellda");

  if (!latitude || !longitude) {
    return res.status(400).send("Latitude and longitude are required");
  }

  const userLat = parseFloat(latitude);
  const userLon = parseFloat(longitude);

  con.query("SELECT * FROM schools", (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).send("Database error");
    }

    const schoolsWithDistance = results.map((school) => {
      const distance = calculateDistance(
        userLat,
        userLon,
        school.latitude,
        school.longitude
      );
      return { ...school, distance };
    });
    console.log(schoolsWithDistance);

    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(schoolsWithDistance);
  });
};

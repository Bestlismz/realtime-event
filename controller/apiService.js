require("dotenv").config();
const axios = require("axios");
var qs = require("qs");

async function openBarrier() {
  try {
    // const url = "http://127.0.0.1:8000/api/open/barrierGate";
    const res = await axios.post(process.env.API_OPEN_BARRIER);
    console.log("********* barrier *********");
    console.log(res.data);
    console.log("***************************");

    return res;
  } catch {
    console.log("********* error *********");
    console.log("error open barrier");
    console.log("*************************");
  }
}

async function checkPaymentLicensePlate(licensePlate, happenTime) {
  try {
    const post = {
      license_plate: licensePlate,
      happen_time: happenTime,
    };
    const res = await axios.post(
      process.env.API_CHECK_PAYMENT,
      qs.stringify(post),
      {
        headers: {
          Authorization: "Bearer " + process.env.TOKEN_LETMEIN,
        },
      }
    );

    console.log("********* checkPayment *********");
    console.log(res.data);
    console.log("********************************");

    return res.data;
  } catch {
    console.log("********* error *********");
    console.log("error check payment");
    console.log("*************************");
  }
}

// (async () => {
//   await checkPaymentLicensePlate("กก9999", "2023-07-19T12:02:23+00:00");
// })();

module.exports = {
  openBarrier,
  checkPaymentLicensePlate,
};

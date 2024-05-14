const fs = require("fs");
const http = require("http");
const multer = require("multer");
const xml2js = require("xml2js");
const connectMqtt = require("./controller/mqtt").connectToRabbitMQ;
const callApi = require("./controller/apiService");
const Provinces = require('./Provinces');
var moment = require("moment");
const { MqttClient } = require("mqtt");

require("dotenv").config();

const upload = multer();

const uploadDir = "./uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("Created uploads directory");
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
    return;
  }

  if (req.method === 'POST') {
    upload.any()(req, res, async (err) => {
      if (err) {
        console.error("Error parsing multipart/form-data:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
        return;
      }

      if (req.files && req.files.length > 0) {
        req.files.forEach(async (file, index) => {
          const fileExtension = file.originalname.split(".").pop();
          const filePath = `${uploadDir}/file_${index + 1}.${fileExtension}`;
          fs.writeFileSync(filePath, file.buffer);
          //console.log(`File saved as ${filePath}`);

          if (filePath.includes("file_1.xml")) {
            try {
              const data = await fs.promises.readFile(filePath, "utf-8");
              xml2js.parseString(data, async (err, result) => {
                if (err) {
                  console.error("Error parsing XML:", err);
                  return;
                }

                const thailandStateID = result.EventNotificationAlert?.ANPR?.[0]?.tailandStateID.shift();
                const licensePlate = result.EventNotificationAlert?.ANPR?.[0]?.licensePlate.shift();
                const device_name = result.EventNotificationAlert.channelName.shift();
                const dateTime = result.EventNotificationAlert.dateTime.shift();
                const thaiProvince = Provinces.thaiProvinces[thailandStateID];
                const jsonData = {
                  device_name: device_name,
                  thailand_state_id: thailandStateID,
                  province: thaiProvince,
                  license_plate: licensePlate,
                  dateTime: dateTime,
                };
                console.log("--------------------------------------");
                console.log("data:", jsonData);
                if(jsonData.license_plate !== undefined || jsonData.province !== undefined || jsonData.thailand_state_id !== undefined){
                  let license_plate_data = {
                    license_plate: jsonData.license_plate,
                    status: 1
                  };
                  if (device_name === process.env.NAME_LPR_IN) {
                    try {
                      await connectMqtt(license_plate_data);
                      console.log("MQTT connection successful");
                    } catch (error) {
                      console.error("Error connecting to MQTT:", error);
                    }
                    await callApi.openBarrier();
                  } else if (device_name === process.env.NAME_LPR_OUT) {
                    /* try {
                      const checkPayment = await callApi.checkPaymentLicensePlate(
                        jsonData.license_plate,
                        jsonData.dateTime
                      );
                      if (checkPayment && checkPayment.status === true) {
                        await callApi.openBarrier();
                        console.log("Barrier opened successfully");
                      } else {
                        console.log("Payment not verified, barrier remains closed");
                      }
                    } catch (error) {
                      console.error("Error checking payment:", error);
                    } */
                  }
                }
              });
            } catch (err) {
              console.error("Error reading file:", err);
            }
          }
        });
      }
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Data received successfully");
    });
  } else {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Please send a POST request to upload files.\n');
  }
});

const startServer = async () => {
  try {
    server.listen(process.env.SERVER_PORT, process.env.SERVER_IP, () => {
      console.log(
        `Server running at ${process.env.SERVER_IP}:${process.env.SERVER_PORT}`
      );
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();

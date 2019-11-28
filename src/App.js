import React, { useState, useEffect } from "react";
import FileInput from "bs-custom-file-input";
import "./App.css";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  tbody,
  thead,
  tr,
  th,
  td
} from "react-bootstrap";
const pdfjsLib = require("pdfjs-dist");
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const WGPA_THRESHOLD = {
  6.2: "Honours I",
  5.65: "Honours IIA",
  5.0: "Honours IIB",
  4.0: "Honours IIIA",
  0: "Honours IIIB"
};

function App() {
  useEffect(() => {
    FileInput.init();
  }, []);

  const [filename, setfilename] = useState("Choose file");
  const [wgpa, setwgpa] = useState(0);
  const [classHons, setclassHons] = useState("");
  const [courseTableEntries, setCourseTableEntries] = useState([]);
  // const [continuePage, setContinuePage] = useState(false)

  const handleFile = async e => {
    if (e.target.files[0] === undefined) {
      return;
    }
    setfilename(e.target.files[0].name);
    const fr = new FileReader();
    let data = [];
    fr.onload = e => {
      data = fr.result;
      process(data);
    };

    fr.readAsArrayBuffer(e.target.files[0]);
    // const data = await e.target.files[0].arrayBuffer();
  };

  const process = async data => {
    let sum_unit_gpa = 0;
    let sum_unit = 0;
    const doc = await pdfjsLib.getDocument(data);
    const pages = [];

    const course_table_entries = [];

    for (let i = 1; i <= doc.numPages; i++) {
      pages.push(await doc.getPage(i));
    }

    const txt_contents_promise = pages.map(p => {
      return p.getTextContent();
    });

    Promise.all(txt_contents_promise).then(txt_contents => {
      let continuePage = false
      txt_contents.map(tc => {
        const anchor_line = [];
        console.log(continuePage)
        if (continuePage) {
          anchor_line.push(-1)
          console.log('was here')
          continuePage = false
        }
        tc.items.map((txt_line, idx) => {
          txt_line.str.startsWith("Plan") && anchor_line.push(idx);
        });
        let gpa_lines = [];
        anchor_line.map(idx => {
          idx++;
          console.log(tc.items[idx-1])
          while (true) {
            // assumming a course code is only 4 letters (in capitals)
            // console.log(tc.items[idx-1])
            if (idx === tc.items.length) {
              continuePage = true
              break
            }
            let first_four_char = tc.items[idx].str.slice(0, 4);
            if (
              first_four_char !== "    " &&
              !/\d/.test(first_four_char) &&
              first_four_char.toUpperCase() === first_four_char
            ) {
              // console.log(first_four_char);
              gpa_lines.push(tc.items[idx].str);
              idx++;
            } else break;
          }
        });
        gpa_lines.map(line => {
          const words = line.split(" ").filter(word => word !== "");
          const reversed = [...words].reverse();
          // console.log(words)
          const code = words[0] + words[1];
          const course = words.slice(2, words.length - 4).join(" ");
          const year = Number(words[1].slice(0, 1));
          const unit = Number(reversed[2]);
          const gpa = Number(reversed[1]);

          if (gpa === 0 || isNaN(unit)) {
            return
          }

          course_table_entries.push({ code, course, unit, gpa });
          console.log(
            "Year Level: " +
              words[1].slice(0, 1) +
              " ---- Unit: " +
              reversed[2] +
              " ---- GPA: " +
              reversed[1]
          );
          const adjusted_year = year === 6 ? 4 : year === 7 ? 5 : year;
          sum_unit_gpa += adjusted_year * unit * gpa;
          sum_unit += adjusted_year * unit;
        });
      });
      console.log(sum_unit_gpa / sum_unit);
      setwgpa((sum_unit_gpa / sum_unit).toFixed(3));
      setclassHons(classifyHons((sum_unit_gpa / sum_unit).toFixed(3)));
      setCourseTableEntries(course_table_entries);
    });
  };

  const classifyHons = wgpa => {
    const thres_vals = Object.keys(WGPA_THRESHOLD);
    console.log(wgpa);
    console.log(thres_vals);
    let highest_thres = 0;
    for (let i = 0; i < thres_vals.length; i++) {
      if (wgpa > Number(thres_vals[i])) {
        if (Number(thres_vals[i]) > highest_thres) {
          highest_thres = Number(thres_vals[i]);
        }
      }
    }
    return WGPA_THRESHOLD[highest_thres];
  };

  const renderCourseTable = () => {
    return courseTableEntries.map((entry, idx) => {
      return (
        <tr key={idx}>
          <td>{`${entry.code} - ${entry.course}`}</td>
          <td className="txt-center">{entry.unit}</td>
          <td className="txt-center">{entry.gpa}</td>
        </tr>
      );
    });
  };

  return (
    <Container className="App main-container">
      <Row>
        <Col className="mb-2">
          <div className="title mb-2 txt-center">UQ Weighted GPA Calculator</div>
          <Card className="main-card">
            <Card.Subtitle className="subtitle" style={{ lineHeight: "1.6" }}>
              A WGPA calculator for Bachelor of Engineering (Honours)/Master of
              Engineering Students. [See{" "}
              <a href="https://www.eait.uq.edu.au/be-honours">here</a> for more
              info regarding calculation]
              <br />
              Download your 'Study Report' PDF from{" "}
              <a href="https://www.sinet.uq.edu.au/">UQ Si-net</a>
            </Card.Subtitle>
            <Card.Body>
              <div className="ps-rel">
                <input
                  id="inputGroupFile01"
                  type="file"
                  className="custom-file-input pointer"
                  onChange={handleFile}
                />
                <label className="custom-file-label overflow-hid" htmlFor="inputGroupFile01">
                  {filename}
                </label>
              </div>
              {wgpa !== 0 ? (
                <div>
                  <Row className="mt-2">
                    <Col className="ps-rel mb-2" sm={6}>
                      <div className="small-title">GPA:</div>
                      <div className="gpa-hons-body">{wgpa}</div>
                    </Col>
                    <Col className="ps-rel mb-2" sm={6}>
                      <div className="small-title">Class of Honours:</div>
                      <div className="class-info"></div>
                      <div className="gpa-hons-body">{classHons}</div>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Table striped bordered>
                        <thead>
                          <tr>
                            <th>Course</th>
                            <th className="txt-center">Unit</th>
                            <th className="txt-center">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {renderCourseTable()}
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </div>
              ) : null}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;

import { JobsPage } from "./JobsPage";
import { declareComponent } from "@webflow/react";
import "../../../devlink/global.css";
import "../../../devlink/Department.module.css";
import "../../../devlink/JobsList.module.css";
import "../../../devlink/Job.module.css";
import "../../../devlink/_Builtin";
import "../../layouts/globals.css";

export default declareComponent(JobsPage, {
  name: "Job Listings",
  description: "A list of active jobs in Greenhouse",
});

import { createApp, vaporInteropPlugin } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import "virtual:uno.css";

const app = createApp(App);
app.use(vaporInteropPlugin);
app.use(router);
app.mount("#app");

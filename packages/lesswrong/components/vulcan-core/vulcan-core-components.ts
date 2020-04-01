// Also imported by Storybook
import { importComponent } from '../../lib/vulcan-lib';

importComponent("App", () => require('./App'));
importComponent("Card", () => require('./Card'));
importComponent("Datatable", () => require('./Datatable'));
importComponent(["EditButton", "EditForm"], () => require('./EditButton'));
importComponent("Loading", () => require('./Loading'));
importComponent(["NewButton", "NewForm"], () => require('./NewButton'));
importComponent("ScrollToTop", () => require('./ScrollToTop'));

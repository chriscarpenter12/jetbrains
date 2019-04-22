const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const parser = require('fast-xml-parser');
const uuidv4 = require('uuid/v4');
const cleaner = require('deep-cleaner');

// Keep CDATA and attributes
const parserOptions = {
  cdataTagName: '__cdata',
  ignoreAttributes: false
};

const colorsRoot = '/colors';
const colorsPath = `/resources/${colorsRoot}`;
const colorsFolder = path.resolve(__dirname, `../${colorsPath}`);

const themesRoot = '/themes';
const themesFolder = path.resolve(__dirname, `../resources${themesRoot}`);
const themeTemplate = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'template.theme.json'), { encoding: 'utf-8' }));

fs.readdir(colorsFolder, (err, colorFiles) => {
  if (err) {
    exit('Error reading color file');
  }

  colorFiles.forEach(colorFile => {
    const fileName = path.parse(colorFile).name;
    const xml = fs.readFileSync(`${colorsFolder}/${colorFile}`, { encoding: 'utf-8' });
    const colorFileJson = parser.parse(xml, parserOptions);

    const themeJson = generateThemeJson(fileName, colorFileJson);
    saveTheme(fileName, themeJson);
  });
});

function isColorSchemeDark(fileName) {
  return !fileName.endsWith('-light');
}

function getColorValue(json, keyPath, key, secondaryKey = null) {
  let colorValue = null;
  const color = _.get(json, keyPath, null).filter(option => option['@_name'] === key);
  if (color.length) {
    if (color[0].hasOwnProperty('value')) {
      if (_.isArray(color[0]['value']['option']) && secondaryKey) {
        for (option of color[0]['value']['option']) {
          if (option['@_name'] === secondaryKey) {
            colorValue = option['@_value'];
            break;
          }
        }
      } else if (typeof color[0]['value']['option'] === 'object') {
        colorValue = color[0]['value']['option']['@_value'];
      }
    } else if (typeof color[0]['@_value'] === 'string') {
      colorValue = color[0]['@_value'];
    }
  }

  return colorValue === undefined ? null : '#' + colorValue;
}

function generateThemeJson(fileName, colorFileJson) {
  let theme = { ...themeTemplate };
  theme.name = colorFileJson.scheme['@_name'];
  theme.dark = isColorSchemeDark(fileName);
  theme.editorScheme = `${colorsRoot}/${fileName}.xml`;
  theme['ui']['*']['background'] = getColorValue(colorFileJson, 'scheme.colors.option', 'INDENT_GUIDE');
  theme['ui']['*']['foreground'] = getColorValue(colorFileJson, 'scheme.attributes.option', 'CONSOLE_NORMAL_OUTPUT');
  // theme['ui']['*']['foreground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_FOREGROUND');
  theme['ui']['*']['infoForeground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'LINE_NUMBERS_COLOR');
  theme['ui']['*']['selectionBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_BACKGROUND');
  theme['ui']['*']['selectionForeground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_FOREGROUND');
  // theme['ui']['*']['selectionInactiveBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['*']['selectionInactiveBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['*']['selectionBackgroundInactive'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_FOREGROUND');
  theme['ui']['*']['lightSelectionBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_BACKGROUND');
  theme['ui']['*']['lightSelectionForeground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_FOREGROUND');
  theme['ui']['*']['lightSelectionInactiveBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_BACKGROUND');
  theme['ui']['*']['lightSelectionInactiveForeground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_FOREGROUND');
  // theme['ui']['*']['disabledBackground'] = getColorValue(colorFileJson, 'scheme.attributes.option', 'INLINE_PARAMETER_HINT', 'BACKGROUND');
  theme['ui']['*']['disabledBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'INDENT_GUIDE');
  // theme['ui']['*']['inactiveBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['*']['inactiveBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'INDENT_GUIDE');
  theme['ui']['*']['disabledForeground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'LINE_NUMBERS_COLOR');
  theme['ui']['*']['disabledText'] = getColorValue(colorFileJson, 'scheme.colors.option', 'LINE_NUMBERS_COLOR');
  theme['ui']['*']['inactiveForeground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'LINE_NUMBERS_COLOR');
  theme['ui']['*']['acceleratorForeground'] = getColorValue(colorFileJson, 'scheme.attributes.option', 'CONSOLE_NORMAL_OUTPUT');
  theme['ui']['*']['acceleratorSelectionForeground'] = getColorValue(colorFileJson, 'scheme.attributes.option', 'CONSOLE_NORMAL_OUTPUT');
  theme['ui']['*']['errorForeground'] = getColorValue(colorFileJson, 'scheme.attributes.option', 'BREAKPOINT_ATTRIBUTES');
  theme['ui']['*']['disabledBorderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'LINE_NUMBERS_COLOR');
  theme['ui']['*']['focusColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'LINE_NUMBERS_COLOR');
  theme['ui']['*']['focusedBorderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DIFF_SEPARATORS_TOP_BORDER');
  theme['ui']['*']['separatorColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'METHOD_SEPARATORS_COLOR');
  theme['ui']['*']['lineSeparatorColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'METHOD_SEPARATORS_COLOR');
  theme['ui']['*']['modifiedItemForeground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_BACKGROUND');

  theme['ui']['ActionButton']['hoverBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['ActionButton']['hoverBorderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['ActionButton']['pressedBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['ActionButton']['pressedBorderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['Button']['arc'] = 0;
  theme['ui']['Button']['default']['foreground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_FOREGROUND');
  theme['ui']['Button']['default']['startBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_BACKGROUND');
  theme['ui']['Button']['default']['endBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_BACKGROUND');
  theme['ui']['Button']['default']['startBorderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['Button']['default']['endBorderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['Button']['default']['shadowColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['Button']['startBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['Button']['endBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['Button']['startBorderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['Button']['endBorderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['Button']['shadowColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');

  theme['ui']['Borders']['color'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['Borders']['ContrastBorderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');

  theme['ui']['ComboBox']['nonEditableBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['ComboBox']['ArrowButton']['nonEditableBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['ComboPopup.border'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');

  theme['ui']['Editor']['background'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['EditorPane.inactiveBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['EditorTabs']['selectedForeground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'LINE_NUMBERS_COLOR');
  theme['ui']['EditorTabs']['selectedBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['EditorTabs']['underlineColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['EditorTabs']['inactiveMaskColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'INDENT_GUIDE');
  theme['ui']['EditorTabs']['borderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');

  theme['ui']['GutterTooltip.lineSeparatorColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');

  theme['ui']['Link']['activeForeground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_BACKGROUND');
  theme['ui']['Link']['hoverForeground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_BACKGROUND');
  theme['ui']['Link']['pressedForeground'] = getColorValue(colorFileJson, 'scheme.attributes.option', 'LINE_PARTIAL_COVERAGE');
  theme['ui']['Link']['visitedForeground'] = getColorValue(colorFileJson, 'scheme.attributes.option', 'LINE_PARTIAL_COVERAGE');

  theme['ui']['Notification']['borderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');

  theme['ui']['Menu.borderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['MenuBar.borderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'INDENT_GUIDE');
  theme['ui']['NavBar.borderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'INDENT_GUIDE');
  theme['ui']['StatusBar.borderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'INDENT_GUIDE');

  theme['ui']['Popup']['borderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['Popup']['Toolbar.borderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['Popup']['Header.activeBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['Popup']['Header.inactiveBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');

  theme['ui']['ProgressBar']['progressColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_BACKGROUND');
  theme['ui']['ProgressBar']['indeterminateStartColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_BACKGROUND');
  theme['ui']['ProgressBar']['indeterminateEndColor'] = getColorValue(colorFileJson, 'scheme.attributes.option', 'LINE_PARTIAL_COVERAGE');

  theme['ui']['SearchEverywhere']['Header.background'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['SearchEverywhere']['Tab']['selectedForeground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'LINE_NUMBERS_COLOR');
  theme['ui']['SearchEverywhere']['Tab']['selectedBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['SearchEverywhere']['SearchField']['borderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');

  theme['ui']['SpeedSearch']['background'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');

  theme['ui']['ToolWindow']['Header']['borderColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');
  theme['ui']['ToolWindow']['HeaderTab']['selectedBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');
  theme['ui']['ToolWindow']['HeaderTab']['selectedInactiveBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');

  // theme['ui']['Tree']['rowHeight'] = 22;
  // theme['ui']['Tree']['foreground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'SELECTION_FOREGROUND');
  // theme['ui']['Tree']['selectionBackground'] = getColorValue(colorFileJson, 'scheme.attributes.option', 'INLINE_PARAMETER_HINT', 'BACKGROUND');
  theme['ui']['Tree']['selectionInactiveBackground'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');

  theme['ui']['Viewport']['background'] = getColorValue(colorFileJson, 'scheme.colors.option', 'DOCUMENTATION_COLOR');

  theme['ui']['WelcomeScreen']['separatorColor'] = getColorValue(colorFileJson, 'scheme.colors.option', 'GUTTER_BACKGROUND');

  // Cleanup null values from theme template if there are any.
  // This is a terrible way to do this, but it works...
  cleaner(theme);
  cleaner(theme);
  cleaner(theme);

  return JSON.stringify(theme, null, 2);
}

function saveTheme(fileName, themeJson) {
  const themeFile = `${themesFolder}/${fileName}.theme.json`;
  const fileExists = fs.existsSync(themeFile);
  fs.writeFile(themeFile, themeJson, (err) => {
    if (err) {
      exit(`${fileName}.theme.json failed to write`);
    }
  });
  if (!fileExists) {
    saveThemeInPluginXml(fileName);
  }
}

function saveThemeInPluginXml(fileName) {
  const pluginXmlFile = path.resolve(__dirname, '../resources/META-INF/plugin.xml');
  const pluginXml = fs.readFileSync(pluginXmlFile, { encoding: 'utf-8' });
  const pluginFileJson = parser.parse(pluginXml, parserOptions);

  let themes = pluginFileJson['idea-plugin']['extensions']['themeProvider'];
  if (!_.isArray(themes)) {
    if (themes === undefined || typeof themes === 'string') {
      themes = [];
    } else if (typeof themes === 'object') {
      themes = [themes];
    }
  }

  const existingTheme = themes.filter(extension => {
    return extension['@_path'].endsWith(`${fileName}.theme.json`);
  });
  if (!existingTheme.length) {
    themes.push({
      "@_id": uuidv4(),
      "@_path": `${themesRoot}/${fileName}.theme.json`
    });

    if (themes.length) {
      pluginFileJson['idea-plugin']['extensions']['themeProvider'] = themes;
    }

    const xmlParser = new parser.j2xParser({ ...parserOptions, format: true });

    fs.writeFileSync(pluginXmlFile, xmlParser.parse(pluginFileJson));
  }
}

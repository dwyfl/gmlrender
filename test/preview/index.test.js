import GMLPreview from '../../src/preview';
import example000 from './data/example000.xml';
import example001 from './data/example001.xml';

it('creates an empty GML preview', () => {
  const preview = new GMLPreview(example000, 320, 240);
  expect(preview.getPreview('image/png')).toMatchSnapshot();
});

it('creates a basic GML preview', () => {
  const preview = new GMLPreview(example001, 320, 240);
  expect(preview.getPreview('image/png')).toMatchSnapshot();
});

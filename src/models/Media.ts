import mongoose, { Model } from 'mongoose';
import { IContent } from './Content';
import Content from './Content';

// Media is an alias for Content to maintain backward compatibility
// This allows the Progress model to reference 'Media' while using the Content schema
const Media: Model<IContent> =
  mongoose.models.Media || mongoose.model<IContent>('Media', Content.schema);

export default Media;

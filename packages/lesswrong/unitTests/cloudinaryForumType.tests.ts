import { cloudinaryCloudNameSetting, cloudinaryUploadPresetEditorName } from '@/lib/instanceSettings';
import { makeCloudinaryImageUrl } from '@/components/common/cloudinaryHelpers';
import { getCloudinaryConfig } from '@/lib/editor/cloudinaryConfig';
import { uploadToCloudinary } from '@/components/lexical/utils/cloudinaryUpload';

describe('Cloudinary forum configuration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds image URLs with the supplied forum cloud', () => {
    jest.spyOn(cloudinaryCloudNameSetting, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 'af-cloud' : 'lw-cloud'
    );

    expect(makeCloudinaryImageUrl('image-id', { w: '900', f: 'auto' }, 'LessWrong'))
      .toBe('https://res.cloudinary.com/lw-cloud/image/upload/c_crop,g_custom/w_900,f_auto/image-id');
    expect(makeCloudinaryImageUrl('image-id', { w: '900', f: 'auto' }, 'AlignmentForum'))
      .toBe('https://res.cloudinary.com/af-cloud/image/upload/c_crop,g_custom/w_900,f_auto/image-id');
  });

  it('keeps CKEditor settings lazy and separate for each forum', () => {
    const cloudSetting = jest.spyOn(cloudinaryCloudNameSetting, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 'af-cloud' : 'lw-cloud'
    );
    const presetSetting = jest.spyOn(cloudinaryUploadPresetEditorName, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 'af-preset' : 'lw-preset'
    );
    const lw = getCloudinaryConfig('LessWrong').cloudinary;
    const af = getCloudinaryConfig('AlignmentForum').cloudinary;

    expect(cloudSetting).not.toHaveBeenCalled();
    expect(presetSetting).not.toHaveBeenCalled();
    expect(lw.getCloudName()).toBe('lw-cloud');
    expect(af.getCloudName()).toBe('af-cloud');
    expect(lw.getUploadPreset()).toBe('lw-preset');
    expect(af.getUploadPreset()).toBe('af-preset');

    presetSetting.mockReturnValue('updated-preset');
    expect(af.getUploadPreset()).toBe('updated-preset');
  });

  it('uploads to the forum cloud with its preset and preserves cancellation', async () => {
    jest.spyOn(cloudinaryCloudNameSetting, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 'af-cloud' : 'lw-cloud'
    );
    jest.spyOn(cloudinaryUploadPresetEditorName, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 'af-preset' : 'lw-preset'
    );
    const result = { secure_url: 'https://images.example/image.png', public_id: 'image', width: 10, height: 10 };
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify(result), { status: 200 })
    );
    const file = new Blob(['image contents'], { type: 'image/png' });
    const controller = new AbortController();

    expect(await uploadToCloudinary(file, 'AlignmentForum', { signal: controller.signal })).toEqual(result);
    expect(await uploadToCloudinary(file, 'LessWrong')).toEqual(result);

    const [afUrl, afOptions] = fetchMock.mock.calls[0];
    const [lwUrl, lwOptions] = fetchMock.mock.calls[1];
    expect(afUrl).toBe('https://api.cloudinary.com/v1_1/af-cloud/auto/upload');
    expect(lwUrl).toBe('https://api.cloudinary.com/v1_1/lw-cloud/auto/upload');
    expect(afOptions?.signal).toBe(controller.signal);
    const afBody = afOptions?.body;
    const lwBody = lwOptions?.body;
    if (!(afBody instanceof FormData) || !(lwBody instanceof FormData)) {
      throw new Error('Expected multipart upload bodies');
    }
    expect(afBody.get('upload_preset')).toBe('af-preset');
    expect(lwBody.get('upload_preset')).toBe('lw-preset');
    expect(afBody.get('file')).toBeInstanceOf(Blob);
  });
});
